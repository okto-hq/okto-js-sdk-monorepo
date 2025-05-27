import type { MutableRefObject } from 'react';
import type { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Linking } from 'react-native';
import type { OnrampCallbacks } from './types.js';
import type { OnRampService } from './onRampService.js';

type ChannelMessage = {
  id: string;
  type: string;
  params?: Record<string, any>;
  response?: Record<string, any>;
  status?: 'success' | 'loading' | 'error';
  message?: string;
  error?: string;
};

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
    console.log('[WebViewBridge] Initializing with channel-based communication');
    this.webViewRef = webViewRef;
    this.callbacks = callbacks;
    this.onRampService = onRampService;
    this.tokenId = tokenId;
  }

  async handleMessage(event: WebViewMessageEvent): Promise<void> {
    try {
      const message = this.parseMessage(event.nativeEvent.data);
      if (!message) return;

      console.log(`[WebViewBridge] Processing channel message:`, message);

      // Handle different channel types based on the protocol
      if (message.type === 'data') {
        await this.handleRequestChannel(message);
      } else {
        await this.handleLaunchChannel(message);
      }
    } catch (error) {
      console.error('[WebViewBridge] Error handling message:', error);
    }
  }

  private parseMessage(data: string): ChannelMessage | null {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('[WebViewBridge] Error parsing message:', error);
      return null;
    }
  }

  // Handle requestChannel messages (Web → SDK)
  private async handleRequestChannel(message: ChannelMessage): Promise<void> {
    const { id, params } = message;
    
    if (!params?.key) {
      console.warn('[WebViewBridge] Invalid request: missing key');
      return;
    }

    const { key, source } = params;

    try {
      let responseData: any = {};

      switch (key) {
        case 'tokenData':
          if (source === this.tokenId) {
            const tokens = await this.onRampService.getOnRampTokens();
            const tokenData = tokens.find(token => token.id === this.tokenId);
            
            if (tokenData) {
              responseData.tokenData = {
                symbol: tokenData.symbol,
                networkName: tokenData.networkName,
                iconUrl: tokenData.iconUrl,
                precision: tokenData.precision,
              };
            }
          }
          break;

        case 'payToken':
          responseData.payToken = await this.onRampService.getTransactionToken();
          break;

        default:
          // Handle remote config requests
          if (source === 'remote-config') {
            responseData[key] = await this.onRampService.getRemoteConfigValue(key);
          } else {
            console.warn(`[WebViewBridge] Unknown request key: ${key}`);
            this.sendErrorResponse(id, `Unknown request key: ${key}`);
            return;
          }
      }

      this.sendSuccessResponse(id, responseData);
    } catch (error) {
      console.error('[WebViewBridge] Request handling error:', error);
      this.sendErrorResponse(id, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Handle launchChannel messages (Web → SDK)
  private async handleLaunchChannel(message: ChannelMessage): Promise<void> {
    const { type, params } = message;

    switch (type) {
      case 'close':
        this.handleClose(params);
        break;

      case 'url':
        this.handleUrlLaunch(params);
        break;

      case 'onRampCompleted':
        this.handleOnRampCompleted(params);
        break;

      case 'requestPermission':
        await this.handlePermissionRequest(message);
        break;

      default:
        console.warn(`[WebViewBridge] Unknown launch event: ${type}`);
    }
  }

  private handleClose(params?: Record<string, any>): void {
    console.log('[WebViewBridge] Handling close event with params:', params);
    
    const { forwardToRoute, status } = params || {};
    
    // Handle different close scenarios based on status
    switch (status) {
      case 'success':
        this.callbacks.onSuccess?.('Transaction completed successfully');
        break;
      case 'failure':
        this.callbacks.onError?.('Transaction failed');
        break;
      default:
        // Default close behavior
        break;
    }
    
    // Note: forwardToRoute is Okto-specific and can be ignored by SDK
    this.callbacks.onClose?.();
  }

  private async handleUrlLaunch(params?: Record<string, any>): Promise<void> {
    const { url, openApp, type } = params || {};
    
    if (!url) {
      console.warn('[WebViewBridge] URL launch: missing URL');
      return;
    }

    console.log(`[WebViewBridge] Handling URL launch: ${type}`, { url, openApp });

    try {
      if (openApp && await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        // Fallback to system browser
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('[WebViewBridge] Failed to open URL:', error);
      this.callbacks.onError?.(`Failed to open URL: ${url}`);
    }
  }

  private handleOnRampCompleted(params?: Record<string, any>): void {
    const { orderId } = params || {};
    console.log('[WebViewBridge] OnRamp completed:', { orderId });
    
    // This is Okto-specific and can be ignored by SDK implementations
    this.callbacks.onSuccess?.(`OnRamp completed with order: ${orderId}`);
  }

  private async handlePermissionRequest(message: ChannelMessage): Promise<void> {
    const { id, params } = message;
    const permissions = params?.data || {};

    console.log('[WebViewBridge] Handling permission request:', permissions);

    try {
      const results: Record<string, any> = {};

      // Handle camera permission if requested
      if (permissions.camera === true) {
        const cameraResult = await this.onRampService.requestCameraPermission();
        results.camera = cameraResult;
      }

      // Handle other permissions as needed
      if (permissions.microphone === true) {
        // Microphone permission handling would go here
        results.microphone = { 
          permission: 'microphone', 
          status: 'unavailable', 
          granted: false,
          message: 'Microphone permission not implemented'
        };
      }

      this.sendPermissionResponse(id, results);
    } catch (error) {
      console.error('[WebViewBridge] Permission request failed:', error);
      this.sendErrorResponse(id, error instanceof Error ? error.message : 'Permission request failed');
    }
  }

  // Response channel methods (SDK → Web)
  private sendSuccessResponse(id: string, responseData: Record<string, any>): void {
    const response: ChannelMessage = {
      id,
      type: 'data',
      response: responseData,
      status: 'success',
      message: 'Request completed successfully',
    };

    this.postMessageToWebView(response);
  }

  private sendErrorResponse(id: string, errorMessage: string): void {
    const response: ChannelMessage = {
      id,
      type: 'data',
      response: {},
      status: 'error',
      error: errorMessage,
    };

    this.postMessageToWebView(response);
  }

  private sendPermissionResponse(id: string, permissionResults: Record<string, any>): void {
    const response: ChannelMessage = {
      id,
      type: 'requestPermission',
      response: permissionResults,
      status: 'success',
    };

    this.postMessageToWebView(response);
  }

  private postMessageToWebView(message: ChannelMessage): void {
    try {
      if (!this.webViewRef.current) {
        console.warn('[WebViewBridge] WebView reference is null, cannot send message');
        return;
      }

      console.log('[WebViewBridge] Sending message to WebView:', {
        id: message.id,
        type: message.type,
        status: message.status,
      });

      this.webViewRef.current.postMessage(JSON.stringify(message));
    } catch (error) {
      console.error('[WebViewBridge] Failed to send message to WebView:', error);
    }
  }

  cleanup(): void {
    console.log('[WebViewBridge] Cleaning up resources');
    // Clean up any pending requests or subscriptions if needed
  }
}