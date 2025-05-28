import type { MutableRefObject } from 'react';
import type { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { OnrampCallbacks } from './types.js';
import type { OnRampService } from './onRampService.js';
import { Linking } from 'react-native';

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
  channel?: string; // Added to support channel-based messages
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
      console.log(
        '[WebViewBridge] Raw message received:',
        event.nativeEvent.data,
      );
      const message = this.parseMessage(event.nativeEvent.data);
      if (!message) return;

      if (message.params?.source === this.SOURCE_NAME) {
        console.log('[WebViewBridge] Skipping own response message');
        return;
      }

      if (message.type === 'bridge_ready') {
        console.log('[WebViewBridge] Bridge is ready');
        return;
      }

      switch (message.type) {
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
          console.log('[WebViewBridge] Analytics event:', message.params);
          break;
        default:
          console.warn(`[WebViewBridge] Unhandled event: ${message.type}`);
      }
    } catch (error) {
      console.error('[WebViewBridge] Error handling WebView message:', error);
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
        this.sendResponse({
          type: message.type,
          response: { [key]: result },
          source: this.SOURCE_NAME,
          id: messageId,
        });
      } else {
        switch (key) {
          case 'payToken':
            console.log('[WebViewBridge] Fetching transaction token');
            result = await this.onRampService.getTransactionToken();
            this.sendResponse({
              type: message.type,
              response: { [key]: result },
              source: this.SOURCE_NAME,
              id: messageId,
            });
            break;
          case 'tokenData':
            console.log('[WebViewBridge] Fetching token data');
            if (source === this.tokenId) {
              const tokens = await this.onRampService.getOnRampTokens();
              const token = tokens.find((t) => t.id === this.tokenId);
              if (token) {
                // console.log('[WebViewBridge] Token found:', token.iconUrl);
                this.sendResponse({
                  type: message.type,
                  response: {
                    [key]: JSON.stringify({
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
                  source: this.SOURCE_NAME,
                  id: messageId,
                });
              } else {
                throw new Error(`Token with id ${this.tokenId} not found`);
              }
              return;
            }
            break;
          default:
            console.warn(`Unknown data key: ${key}`);
            return;
        }
      }
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
      console.log(
        '[WebViewBridge] Opening URL in external browser:',
        params.url,
      );
      Linking.openURL(params.url).catch((err) =>
        console.error('Failed to open URL:', err),
      );
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
    if (!this.webViewRef.current) {
      console.warn(
        '[WebViewBridge] WebView reference is null, cannot send response',
      );
      return;
    }

    console.log(
      '[WebViewBridge] Sending response to WebView:',
      JSON.stringify(response),
    );

    const responseString = JSON.stringify(response);
    
    const js = `
      (function() {
        try {
          const msg = ${responseString};
          console.log('[WebViewBridge] Posting response message to WebView:', msg);
  
          // // First try the responseChannel
          // if (window.responseChannel && typeof window.responseChannel === 'function') {
          //   window.responseChannel(msg);
          // }
          
          // // Then try postMessage as fallback
          if (window.postMessage) {
            window.postMessage(msg, '*');
          }
          
          // Finally dispatch as custom event
          const event = new CustomEvent('nativeResponse', { detail: msg });
          window.dispatchEvent(event);
        } catch (e) {
          console.error('[WebViewBridge] Failed to post response to WebView:', e);
        }
      })();
    `;

    this.webViewRef.current?.injectJavaScript(js);
  }

  cleanup(): void {
    // Clean up resources if needed
  }
}