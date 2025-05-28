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
      console.log('[WebViewBridge] Raw message received:', event.nativeEvent.data);
      const message = this.parseMessage(event.nativeEvent.data);
      if (!message) return;

      // Prevent infinite loops from our own messages
      if (message.params?.source === this.SOURCE_NAME) {
        console.log('[WebViewBridge] Ignoring message from self');
        return;
      }

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
          this.handleAnalytics(message);
          break;
        default:
          console.warn(`[WebViewBridge] Unhandled event: ${message.type}`);
      }
    } catch (error) {
      console.error('[WebViewBridge] Error handling WebView message:', error);
      // Send error response back to WebView if possible
      if (error instanceof Error) {
        this.sendErrorResponse(error.message);
      }
    }
  }

  private parseMessage(data: string | WebViewMessage): WebViewMessage | null {
    try {
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      return data;
    } catch (error) {
      console.error('[WebViewBridge] Error parsing message:', error);
      return null;
    }
  }

  private handleNativeBack(params?: { control?: boolean }): void {
    console.log('[WebViewBridge] Native back requested:', params);
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
    if (!params?.key) {
      console.warn('[WebViewBridge] Data request missing key parameter');
      return;
    }

    const { key, source = '' } = params;
    const messageId = id || '';

    try {
      let result: string | Record<string, unknown> = '';
      
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
              console.log('[WebViewBridge] Token data retrieved:', {
                tokenCount: Array.isArray(tokenData) ? tokenData.length : 'unknown',
                preview: result.length > 100 ? `${result.substring(0, 100)}...` : result
              });
            } else {
              console.warn(`[WebViewBridge] Token data requested with invalid source: ${source}, expected: ${this.tokenId}`);
              result = '[]';
            }
            break;
          default:
            console.warn(`[WebViewBridge] Unknown data key: ${key}`);
            this.sendErrorResponse(`Unknown data key: ${key}`, messageId);
            return;
        }
      }

      console.log('[WebViewBridge] Data request successful, sending response:', {
        key,
        resultLength: typeof result === 'string' ? result.length : JSON.stringify(result).length,
        preview: typeof result === 'string' 
          ? (result.length > 100 ? `${result.substring(0, 100)}...` : result)
          : JSON.stringify(result).substring(0, 100) + '...'
      });

      this.sendResponse({
        type: message.type,
        response: { [key]: result },
        source: this.SOURCE_NAME,
        id: messageId,
      });
    } catch (error) {
      console.error(`[WebViewBridge] Error processing data request for key ${key}:`, error);
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
    console.log('[WebViewBridge] URL navigation requested:', params?.url);
    if (params?.url) {
      // Handle URL navigation if needed
      // this.callbacks.onUrlChange?.(params.url);
    }
  }

  private async handlePermissionRequest(message: WebViewMessage): Promise<void> {
    console.log('[WebViewBridge] Permission request received:', message.params);
    
    if (!message.params?.data) {
      console.warn('[WebViewBridge] Permission request missing data');
      return;
    }

    try {
      const permissionResult = await this.onRampService.requestCameraPermission();
      console.log('[WebViewBridge] Permission result:', permissionResult);

      this.sendResponse({
        type: 'requestPermission',
        response: permissionResult,
        source: this.SOURCE_NAME,
        id: message.id || '',
      });
    } catch (error) {
      console.error('[WebViewBridge] Permission request failed:', error);
      this.sendErrorResponse(
        error instanceof Error ? error.message : 'Permission request failed',
        message.id
      );
    }
  }

  private handlePermissionAck(message: WebViewMessage): void {
    console.log('[WebViewBridge] Permission acknowledgment received');
    this.sendResponse({
      type: 'requestPermission',
      response: message.response || {},
      source: this.SOURCE_NAME,
      id: message.id || '',
    });
  }

  private handleAnalytics(message: WebViewMessage): void {
    console.log('[WebViewBridge] Analytics event received:', message.params);
    // Implement analytics handling if needed
    // this.callbacks.onAnalytics?.(message.params);
  }

  private sendResponse(response: WebViewResponse): void {
    if (!this.webViewRef.current) {
      console.error('[WebViewBridge] WebView reference is null, cannot send response');
      return;
    }

    console.log('[WebViewBridge] Sending response to WebView:', {
      type: response.type,
      id: response.id,
      responseSize: JSON.stringify(response.response)?.length || 0,
    });

    // Escape the response properly to prevent injection issues
    const escapedResponse = JSON.stringify(response.response).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    const js = `
      (function() {
        try {
          const msg = JSON.parse('${escapedResponse}');
          if (window.postMessage) {
            window.postMessage(msg, '*');
            console.log('[WebView] Message posted successfully');
          } else {
            console.error('[WebView] postMessage not available');
          }
        } catch (e) {
          console.error('[WebView] Failed to post message:', e);
        }
      })();
    `;

    this.webViewRef.current.injectJavaScript(js);
  }

  private sendErrorResponse(errorMessage: string, messageId?: string): void {
    this.sendResponse({
      type: 'error',
      response: { error: errorMessage },
      source: this.SOURCE_NAME,
      id: messageId || '',
    });
  }

  cleanup(): void {
    console.log('[WebViewBridge] Cleaning up resources');
    // Clean up resources if needed
  }
}