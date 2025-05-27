import type { MutableRefObject } from 'react';
import type { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { OnrampCallbacks } from './types.js';
import type { OnRampService } from './onRampService.js';

type WebViewParams = {
  control?: boolean;
  key?: string;
  source?: string;
  url?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

type WebViewMessage = {
  type: string;
  params?: WebViewParams;
  id?: string;
  response?: Record<string, unknown>;
};

type WebViewResponse = {
  type: string;
  response: unknown;
  source: string;
  id: string;
};

export class WebViewBridge {
  private readonly webViewRef: MutableRefObject<WebView | null>;
  private readonly callbacks: OnrampCallbacks;
  private readonly onRampService: OnRampService;
  private readonly tokenId: string;
  private readonly SOURCE_NAME = 'okto_web';

  constructor(
    webViewRef: MutableRefObject<WebView | null>,
    callbacks: OnrampCallbacks,
    onRampService: OnRampService,
    tokenId: string,
  ) {
    console.log('[WebViewBridge] Initializing with:', {
      webViewRef: !!webViewRef.current,
      callbacks: Object.keys(callbacks),
      onRampService,
      tokenId,
    });

    this.webViewRef = webViewRef;
    this.callbacks = callbacks;
    this.onRampService = onRampService;
    this.tokenId = tokenId;
  }

  async handleMessage(event: WebViewMessageEvent): Promise<void> {
    try {
      console.log('[WebViewBridge] Raw message received:', event);
      const message = this.parseMessage(event.nativeEvent.data);
      if (!message) return;

      console.log(`[WebViewBridge] Processing message type: ${message.type}`, {
        params: message.params,
        id: message.id,
      });

      switch (message.type) {
        case 'nativeBack':
          console.log('[WebViewBridge] Handling nativeBack event');
          this.handleNativeBack(message.params);
          break;
        case 'data':
          console.log('[WebViewBridge] Handling data request');
          await this.handleDataRequest(message);
          break;
        case 'close':
          console.log('[WebViewBridge] Handling close event');
          this.callbacks.onClose?.();
          break;
        case 'url':
          this.handleUrl({ url: message.params?.url });
          break;
        case 'requestPermission':
          await this.handlePermissionRequest(message);
          break;
        case 'requestPermissionAck':
          this.handlePermissionAck(message);
          break;
        case 'analytics':
          // Handle analytics if needed
          break;
        default:
          console.warn(`Unhandled event: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  }

  private parseMessage(data: string | WebViewMessage): WebViewMessage | null {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      console.error('Error parsing message:', error);
      return null;
    }
  }

  private handleNativeBack(params?: { control?: boolean }): void {
    if (params?.control) {
      this.callbacks.onClose?.();
    }
    // Add other back navigation logic if needed
  }

  private async handleDataRequest(message: WebViewMessage): Promise<void> {
    console.log('[WebViewBridge] Processing data request:', {
      key: message.params?.key,
      source: message.params?.source,
      id: message.id,
    });

    const { params, id } = message;
    if (!params?.key) return;

    const { key, source = '' } = params;
    const messageId = id || '';

    try {
      let result = '';
      console.log('[WebViewBridge] Data request details:', { key, source });
      if (source === 'remote-config') {
        result = await this.onRampService.getRemoteConfigValue(key);
      } else {
        switch (key) {
          case 'transactionId':
            console.log('[WebViewBridge] Fetching transaction token');
            result = await this.onRampService.getTransactionToken();
            break;
          case 'tokenData':
            console.log('[WebViewBridge] Fetching token data');
            if (source === this.tokenId) {
              const tokenData = await this.onRampService.getOnRampTokens();
              result = JSON.stringify(tokenData);
            }
            break;
          default:
            console.warn(`Unknown data key: ${key}`);
            return;
        }
      }
      console.log(
        '[WebViewBridge] Data request successful, sending response:',
        {
          key,
          result:
            result.length > 100 ? `${result.substring(0, 100)}...` : result,
        },
      );

      this.sendResponse({
        type: message.type,
        response: { [key]: result },
        source: this.SOURCE_NAME,
        id: messageId,
      });
    } catch (error) {
      this.sendResponse({
        type: message.type,
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
          [key]: '',
        },
        source: this.SOURCE_NAME,
        id: messageId,
      });
    }
  }

  private handleUrl(params?: { url?: string }): void {
    if (params?.url) {
      // Handle URL navigation if needed
    }
  }

  private async handlePermissionRequest(
    message: WebViewMessage,
  ): Promise<void> {
    if (!message.params?.data) return;

    try {
      const permissionResult =
        await this.onRampService.requestCameraPermission();

      this.sendResponse({
        type: 'requestPermission',
        response: permissionResult,
        source: this.SOURCE_NAME,
        id: message.id || '',
      });
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }

  private handlePermissionAck(message: WebViewMessage): void {
    this.sendResponse({
      type: 'requestPermission',
      response: message.response || {},
      source: this.SOURCE_NAME,
      id: message.id || '',
    });
  }

  private sendResponse(response: WebViewResponse): void {
    try {
      console.log('[WebViewBridge] Sending response to WebView:', {
        type: response.type,
        id: response.id,
        responseSize: JSON.stringify(response.response)?.length,
      });

      this.webViewRef.current?.postMessage(JSON.stringify(response));
    } catch (error) {
      console.error('Failed to send response to WebView:', error);
    }
  }

  cleanup(): void {
    // Clean up resources if needed
  }
}
