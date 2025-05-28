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
      console.log('[WebViewBridge] Raw message received:', event.nativeEvent.data);
      const message = this.parseMessage(event.nativeEvent.data);
      if (!message) return;
  
      // Skip processing messages that are responses from our own bridge
      if (message.params?.source === this.SOURCE_NAME) {
        console.log('[WebViewBridge] Skipping own response message');
        return;
      }
  
      // Handle bridge ready message
      if (message.type === 'bridge_ready') {
        console.log('[WebViewBridge] Bridge is ready');
        return;
      }
  
      // Handle channel-based messages from the web app
      if (message.channel) {
        console.log(`[WebViewBridge] Processing ${message.channel} channel message:`, message);
        
        switch (message.channel) {
          case 'launch':
            await this.handleLaunchMessage(message);
            break;
          case 'info':
            await this.handleInfoMessage(message);
            break;
          case 'request':
            await this.handleRequestMessage(message);
            break;
          default:
            console.warn(`[WebViewBridge] Unknown channel: ${message.channel}`);
        }
        return;
      }
  
      // Handle legacy message format
      console.log(`[WebViewBridge] Processing legacy message type: ${message.type} ${message.channel}`, {
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
          console.log('[WebViewBridge] Analytics event:', message.params);
          break;
        default:
          console.warn(`[WebViewBridge] Unhandled event: ${message.type}`);
      }
    } catch (error) {
      console.error('[WebViewBridge] Error handling WebView message:', error);
    }
  }
  
  private async handleLaunchMessage(message: any): Promise<void> {
    console.log('[WebViewBridge] Handling launch message:', message);
    
    // Parse the message type from the launch data
    if (message.type) {
      switch (message.type) {
        case 'close':
          console.log('[WebViewBridge] Launch close event');
          this.callbacks.onClose?.();
          break;
        case 'data':
          await this.handleDataRequest(message);
          break;
        default:
          console.log(`[WebViewBridge] Unhandled launch type: ${message.type}`);
      }
    }
  }
  
  private async handleInfoMessage(message: any): Promise<void> {
    console.log('[WebViewBridge] Handling info message:', message);
    // Handle info channel messages if needed
  }
  
  private async handleRequestMessage(message: any): Promise<void> {
    console.log('[WebViewBridge] Handling request message:', message);
    
    // Parse the message type from the request data
    if (message.type) {
      switch (message.type) {
        case 'data':
          await this.handleDataRequest(message);
          break;
        case 'requestPermission':
          await this.handlePermissionRequest(message);
          break;
          case 'requestPermissionAck':
          this.handlePermissionAck(message);
          break;
        default:
          console.log(`[WebViewBridge] Unhandled request type: ${message.type}`);
      }
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
      // this.callbacks.onClose?.();
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
      console.log('[WebViewBridge] Opening URL in external browser:', params.url);
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
      console.warn('[WebViewBridge] WebView reference is null, cannot send response');
      return;
    }
  
    console.log('[WebViewBridge] Sending response to WebView:', JSON.stringify(response));
  
    const js = `
      (function() {
        try {
          const msg = ${JSON.stringify(response)};
          console.log('[WebViewBridge] Posting response message to WebView:', msg);
          
          // Call the global responseChannel function
          if (window.responseChannel && typeof window.responseChannel === 'function') {
            window.responseChannel(msg);
          }
          
          // Also post as message event for addEventListener handlers
          window.postMessage(msg, '*');
          
          // Dispatch custom event as backup
          const event = new CustomEvent('nativeResponse', { detail: msg });
          window.dispatchEvent(event);
          
        } catch (e) {
          console.error('[WebViewBridge] Failed to post response to WebView:', e);
        }
      })();
    `;
    
    this.webViewRef.current?.injectJavaScript(js);
  }
  
  // Alternative method for sending responses through specific channels
  private sendChannelResponse(channel: string, response: any): void {
    if (!this.webViewRef.current) {
      console.warn('[WebViewBridge] WebView reference is null, cannot send channel response');
      return;
    }
  
    const responseWithSource = {
      ...response,
      source: this.SOURCE_NAME,
      channel
    };
  
    console.log(`[WebViewBridge] Sending ${channel} channel response:`, responseWithSource);
  
    const js = `
      (function() {
        try {
          const msg = ${JSON.stringify(responseWithSource)};
          console.log('[WebViewBridge] Posting ${channel} response:', msg);
          
          // Call the appropriate response handler
          if (window.responseChannel && typeof window.responseChannel === 'function') {
            window.responseChannel(msg);
          }
          
          // Also trigger message event
          const event = new MessageEvent('message', {
            data: msg,
            origin: window.location.origin,
            source: window
          });
          window.dispatchEvent(event);
          
        } catch (e) {
          console.error('[WebViewBridge] Failed to post ${channel} response:', e);
        }
      })();
    `;
    
    this.webViewRef.current?.injectJavaScript(js);
  }

  cleanup(): void {
    // Clean up resources if needed
  }
}
