import type { MutableRefObject } from 'react';
import type { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  SOURCE_NAME,
  type OnrampCallbacks,
  type OnRampWebViewMessage,
  type OnRampWebViewResponse,
} from './types.js';
import type { OnRampService } from './onRampService.ts';
import { logger } from '../../utils/logger.js';
import { Linking } from 'react-native';

export class WebViewBridge {
  private readonly webViewRef: MutableRefObject<WebView | null>;
  private readonly callbacks: OnrampCallbacks;
  private readonly onRampService: OnRampService;
  private readonly tokenId: string;

  constructor(
    webViewRef: MutableRefObject<WebView | null>,
    callbacks: OnrampCallbacks,
    onRampService: OnRampService,
    tokenId: string,
  ) {
    this.webViewRef = webViewRef;
    this.callbacks = callbacks;
    this.onRampService = onRampService;
    this.tokenId = tokenId;
    this.logInitialization();
  }

  // Public methods
  public async handleMessage(event: WebViewMessageEvent): Promise<void> {
    try {
      const message = this.parseMessage(event.nativeEvent.data);
      if (!message) return;

      if (this.shouldSkipMessage(message)) return;

      await this.routeMessage(message);
    } catch (error) {
      logger.error('[WebViewBridge] Error handling message:', error);
    }
  }

  public cleanup(): void {
    logger.log('[WebViewBridge] Cleaning up resources');
  }

  private logInitialization(): void {
    logger.log('[WebViewBridge] Initializing with:', {
      webViewRef: !!this.webViewRef.current,
      callbacks: Object.keys(this.callbacks),
      onRampService: this.onRampService,
      tokenId: this.tokenId,
    });
  }

  private shouldSkipMessage(message: OnRampWebViewMessage): boolean {
    if (message.params?.source === SOURCE_NAME) {
      logger.log('[WebViewBridge] Skipping own response message');
      return true;
    }

    if (message.type === 'bridge_ready') {
      logger.log('[WebViewBridge] Bridge is ready');
      return true;
    }

    return false;
  }

  private async routeMessage(message: OnRampWebViewMessage): Promise<void> {
    logger.log('[WebViewBridge] Handling message:', message);

    // Handle meta events first
    if (message.type === 'onMetaHandler') {
      this.handleMetaEvent(message);
      return;
    }

    // Handle special cases
    if (message.type === 'onRampCompleted') {
      this.handleOnRampCompleted();
      return;
    }

    // Route to appropriate handler
    switch (message.type) {
      case 'data':
        await this.handleDataRequest(message);
        break;
      case 'close':
        this.handleCloseEvent();
        break;
      case 'url':
        this.handleUrl(message.params?.url, message.params?.type);
        break;
      case 'requestPermission':
        await this.handlePermissionRequest(message);
        break;
      case 'requestPermission_ack':
        this.handlePermissionAck(message);
        break;
      case 'analytics':
        this.handleAnalytics(message);
        break;
      default:
        logger.warn(`[WebViewBridge] Unhandled event: ${message.type}`);
    }
  }

  private parseMessage(
    data: string | OnRampWebViewMessage,
  ): OnRampWebViewMessage | null {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      logger.error('Error parsing message:', error);
      return null;
    }
  }

  private async handleDataRequest(
    message: OnRampWebViewMessage,
  ): Promise<void> {
    const { params, id = '' } = message;
    if (!params?.key) return;

    const { key, source = '' } = params;

    try {
      if (source === 'remote-config') {
        await this.handleRemoteConfigRequest(key, id);
        return;
      }

      switch (key) {
        case 'payToken':
          await this.handleTransactionTokenRequest(key, id);
          break;
        case 'tokenData':
          await this.handleTokenDataRequest(id);
          break;
        case 'orderSuccessBottomSheet':
          this.handleOrderSuccess();
          break;
        case 'orderFailureBottomSheet':
          this.handleOrderFailure();
          break;
        default:
          logger.warn(`Unknown data key: ${key}`);
      }
    } catch (error) {
      this.sendErrorResponse(message.type, key, id, error);
    }
  }

  private async handleRemoteConfigRequest(
    key: string,
    id: string,
  ): Promise<void> {
    const result = await this.onRampService.getRemoteConfigValue(key);
    this.sendResponse({
      type: 'data',
      response: { [key]: result },
      source: SOURCE_NAME,
      id,
    });
  }

  private async handleTransactionTokenRequest(
    key: string,
    id: string,
  ): Promise<void> {
    const result = await this.onRampService.getTransactionToken();
    this.sendResponse({
      type: 'data',
      response: { [key]: result },
      source: SOURCE_NAME,
      id,
    });
  }

  private async handleTokenDataRequest(id: string): Promise<void> {
    const tokens = await this.onRampService.getOnRampTokens();
    const token = tokens.find((t) => t.id === this.tokenId);

    if (!token) {
      throw new Error(`Token with id ${this.tokenId} not found`);
    }

    this.sendResponse({
      type: 'data',
      response: {
        tokenData: JSON.stringify({
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          iconUrl: token.iconUrl,
          networkId: token.networkId,
          networkName: token.networkName,
          address: token.address,
          precision: token.precision,
          chainId: token.chainId,
        }),
      },
      source: SOURCE_NAME,
      id,
    });
  }

  private handleCloseEvent(): void {
    logger.log('[WebViewBridge] Handling close event');
    this.callbacks.onClose?.();
  }

  private handleUrl(url?: string, type?: string): void {
    if (!url) return;

    if (type === 'KYC-REDIRECT') {
      Linking.openURL(url);
      return;
    }

    logger.log('[WebViewBridge] Handling URL:', url);

    if (!this.webViewRef.current) {
      logger.warn('[WebViewBridge] WebView reference is null');
      return;
    }

    const js = `
      (function() {
        try {
          window.location.href = '${url}';
        } catch (e) {
          console.error('Failed to load URL:', e);
        }
      })();
    `;

    this.webViewRef.current.injectJavaScript(js);
  }

  private async handlePermissionRequest(
    message: OnRampWebViewMessage,
  ): Promise<void> {
    if (!message.params?.data) return;

    const permissionType = message.params.permissionType || 'camera';

    try {
      let permissionResult;

      switch (permissionType) {
        case 'camera':
          permissionResult = await this.onRampService.requestCameraPermission();
          break;
        case 'microphone':
          permissionResult =
            await this.onRampService.requestMicrophonePermission();
          break;
        default:
          logger.warn(
            `[WebViewBridge] Unknown permission type: ${permissionType}`,
          );
          return;
      }

      if (permissionResult.granted) {
        this.handlePermissionGranted(message);
      } else {
        this.handlePermissionDenied(message);
      }
    } catch (error) {
      logger.error('[WebViewBridge] Error handling permission request:', error);
    }
  }

  private handlePermissionGranted(message: OnRampWebViewMessage): void {
    if (message.params?.data) {
      const permissionData = {
        requestPermissions: message.params.data,
      };
      this.sendMessageToWebView(JSON.stringify(permissionData));
    }

    const ackModel = {
      ...message,
      type: 'requestPermissions',
    };

    this.sendResponse({
      type: ackModel.type,
      response: this.createAckResponse(ackModel),
      source: SOURCE_NAME,
      id: message.id || '',
    });
  }

  private handlePermissionDenied(message: OnRampWebViewMessage): void {
    logger.log('[WebViewBridge] Permission denied, showing retry dialog');
    this.showPermissionRetryDialog(() => {
      this.handlePermissionRequest(message);
    });
  }

  private handlePermissionAck(message: OnRampWebViewMessage): void {
    const ackModel = {
      ...message,
      type: 'requestPermission',
    };

    this.sendResponse({
      type: ackModel.type,
      response: this.createAckResponse(ackModel),
      source: SOURCE_NAME,
      id: message.id || '',
    });
  }

  private handleAnalytics(message: OnRampWebViewMessage): void {
    logger.log('[WebViewBridge] Analytics event:', message.params);
  }

  private handleMetaEvent(message: OnRampWebViewMessage): void {
    try {
      const detail = message.detail;
      if (!detail) return;

      this.callbacks.onClose?.();

      if (detail.paymentStatus === 'success') {
        this.callbacks.onSuccess?.(JSON.stringify(detail, null, 2));
      } else if (detail.paymentStatus === 'failed') {
        this.callbacks.onError?.(JSON.stringify(detail, null, 2));
      }
    } catch (error) {
      logger.error('[WebViewBridge] Error handling meta event:', error);
    }
  }

  private handleOnRampCompleted(): void {
    this.callbacks.onSuccess?.(
      'Transaction successful. It may take a few minutes to complete!',
    );
  }

  private handleOrderSuccess(): void {
    this.handleOnRampCompleted();
  }

  private handleOrderFailure(): void {
    this.callbacks.onError?.('Transaction failed. Please try again');
  }

  private showPermissionRetryDialog(onRetry: () => void): void {
    logger.log('[WebViewBridge] Showing permission retry dialog');
    setTimeout(onRetry, 2000);
  }

  private createAckResponse(
    model: OnRampWebViewMessage,
  ): Record<string, unknown> {
    return {
      type: model.type,
      id: model.id,
      params: model.params,
      source: SOURCE_NAME,
      timestamp: Date.now(),
    };
  }

  private sendErrorResponse(
    type: string,
    key: string,
    id: string,
    error: unknown,
  ): void {
    this.sendResponse({
      type,
      response: {
        error: error instanceof Error ? error.message : 'Unknown error',
        [key]: '',
      },
      source: SOURCE_NAME,
      id,
    });
  }

  private sendMessageToWebView(message: string): void {
    if (!this.webViewRef.current) {
      logger.warn('[WebViewBridge] WebView reference is null');
      return;
    }

    const js = `
      (function() {
        try {
          const msg = ${message};
          // First try the responseChannel
          if (window.responseChannel && typeof window.responseChannel === 'function') {
            window.responseChannel(msg);
          }
          
          // // Then try postMessage as fallback
          if (window.postMessage) {
            window.postMessage(msg, '*');
          }
          
          // Finally dispatch as custom event
          const event = new CustomEvent('nativeResponse', { detail: msg });
          window.dispatchEvent(event);
        } catch (e) {
          console.error('Failed to post message:', e);
        }
      })();
    `;

    this.webViewRef.current.injectJavaScript(js);
  }

  private sendResponse(response: OnRampWebViewResponse): void {
    if (!this.webViewRef.current) {
      logger.warn(
        '[WebViewBridge] WebView reference is null, cannot send response',
      );
      return;
    }

    logger.log(
      '[WebViewBridge] Sending response to WebView:',
      JSON.stringify(response),
    );

    const responseString = JSON.stringify(response);

    const js = `
      (function() {
        try {
          const msg = ${responseString};
          console.log('[WebViewBridge] Posting response message to WebView:', msg);
  
          // First try the responseChannel
          if (window.responseChannel && typeof window.responseChannel === 'function') {
            window.responseChannel(msg);
          }
          
          // // Then try postMessage as fallback
          if (window.postMessage) {
            window.postMessage(msg, '*');
          }
          
          // Finally dispatch as custom event
          const event = new CustomEvent('nativeResponse', { detail: msg });
          window.dispatchEvent(event);
        } catch (e) {
          console.log('[WebViewBridge] Failed to post response to WebView:', e);
        }
      })();
    `;

    this.webViewRef.current?.injectJavaScript(js);
  }
}
