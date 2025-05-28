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
  private isBridgeReady = false;
  private messageQueue: WebViewMessageEvent[] = [];

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
      const message = this.parseMessage(event.nativeEvent.data);
      if (!message) return;

      if (message.params?.source === this.SOURCE_NAME) {
        return;
      }

      // Handle bridge ready message
      if (message.type === 'bridgeReady') {
        this.isBridgeReady = true;
        // Process queued messages
        this.messageQueue.forEach(queuedEvent => this.processMessage(queuedEvent));
        this.messageQueue = [];
        return;
      }

      // Don't process other messages until bridge is ready
      if (!this.isBridgeReady) {
        console.log('[WebViewBridge] Bridge not ready, queuing message:', message.type);
        this.messageQueue.push(event);
        return;
      }

      await this.processMessage(event);
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  }

  private async processMessage(event: WebViewMessageEvent): Promise<void> {
    const message = this.parseMessage(event.nativeEvent.data);
    if (!message) return;

    console.log(`[WebViewBridge] Processing message type: ${message.type}`, {
      params: message.params,
      id: message.id,
    });

    switch (message.type) {
      case 'nativeBack':
        this.handleNativeBack(message.params);
        break;
      case 'data':
        await this.handleDataRequest(message);
        break;
      case 'close':
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
        break;
      default:
        console.warn(`Unhandled event: ${message.type}`);
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
  }

  private async handleDataRequest(message: WebViewMessage): Promise<void> {
    const { params, id } = message;
    if (!params?.key) return;

    const { key, source = '' } = params;
    const messageId = id || '';

    // Send immediate acknowledgment
    this.sendResponse({
      type: 'ack',
      response: { received: true, key },
      source: this.SOURCE_NAME,
      id: messageId,
    });

    try {
      let result = '';
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
            result = await this.onRampService.getTransactionToken();
            this.sendResponse({
              type: message.type,
              response: { [key]: result },
              source: this.SOURCE_NAME,
              id: messageId,
            });
            break;
          case 'tokenData':
            if (source === this.tokenId) {
              const tokens = await this.onRampService.getOnRampTokens();
              const token = tokens.find((t) => t.id === this.tokenId);
              if (token) {
                this.sendResponse({
                  type: message.type,
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
                  source: this.SOURCE_NAME,
                  id: messageId,
                });
              } else {
                throw new Error(`Token with id ${this.tokenId} not found`);
              }
            }
            break;
          default:
            console.warn(`Unknown data key: ${key}`);
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
      // Handle URL navigation if needed
    }
  }

  private async handlePermissionRequest(message: WebViewMessage): Promise<void> {
    if (!message.params?.data) return;

    try {
      const permissionResult = await this.onRampService.requestCameraPermission();
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

    const js = `
      (function() {
        try {
          const msg = ${JSON.stringify(response)};
          window.postMessage(msg, '*');
        } catch (e) {
          console.error('Failed to post message to WebView:', e);
        }
      })();
    `;
    this.webViewRef.current?.injectJavaScript(js);
  }

  cleanup(): void {
    this.messageQueue = [];
  }
}