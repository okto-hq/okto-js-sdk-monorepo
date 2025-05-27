import type { MutableRefObject } from 'react';
import type { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { OnrampCallbacks } from './types.js';
import type { OnRampService } from './onRampService.js';

// Type definitions
type HostRequest = {
  type: string;
  id?: string;
  params?: Record<string, unknown>;
  [key: string]: unknown;
};

type HostResponse = {
  type: string;
  id?: string;
  response?: Record<string, unknown>;
  source?: string;
  [key: string]: unknown;
};

enum HostEvent {
  DATA = 'data',
  CLOSE = 'close',
  URL = 'url',
  REQUEST_PERMISSION = 'requestPermission',
  REQUEST_PERMISSION_ACK = 'requestPermissionAck',
  NATIVE_BACK = 'nativeBack',
  ANALYTICS = 'analytics',
  REMOVE_LISTENER = 'removeListener'
}

enum AppName {
  OktoWeb = 'okto_web'
}

type ChannelMessage = {
  channel: 'launchChannel' | 'requestChannel' | 'infoChannel';
  data: string;
};

export class WebViewBridge {
  private readonly webViewRef: MutableRefObject<WebView | null>;
  private readonly callbacks: OnrampCallbacks;
  private readonly onRampService: OnRampService;
  private readonly tokenId: string;
  private readonly sourceName = AppName.OktoWeb;
  private readonly callbackHandlers = new Map<string, (res: HostResponse) => void>();

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

    this.setupChannels();
  }

  private setupChannels(): void {
    const channels = ['launchChannel', 'requestChannel', 'infoChannel'];
    const channelSetup = channels.map(channel => `
      window.${channel} = {
        postMessage: function(data) {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            channel: '${channel}',
            data: data
          }));
        }
      };
    `).join('');

    const injectedJS = `
      (function() {
        // Setup communication channels
        ${channelSetup}
        
        // Response channel handler
        window.responseChannel = function(hostRes) {
          // This will be handled by the web app's callback system
        };
        
        true;
      })();
    `;

    this.webViewRef.current?.injectJavaScript(injectedJS);
  }

  async handleMessage(event: WebViewMessageEvent): Promise<void> {
    try {
      console.log('[WebViewBridge] Raw message received:', event.nativeEvent.data);
      
      const message = this.parseMessage(event.nativeEvent.data);
      if (!message) {
        console.warn('[WebViewBridge] Failed to parse message or message was null');
        return;
      }

      console.log('[WebViewBridge] Parsed message:', {
        channel: message.channel,
        data: message.data,
        timestamp: new Date().toISOString()
      });

      await this.handleChannelMessage(message.channel, message.data);
    } catch (error) {
      console.error('[WebViewBridge] Error handling message:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        rawMessage: event.nativeEvent.data,
        stack: error instanceof Error ? error.stack : undefined
      });
      this.callbacks.onError?.('Failed to process message');
    }
  }

  private async handleChannelMessage(channel: string, data: string): Promise<void> {
    try {
      const hostReq: HostRequest = JSON.parse(data);
      
      const channelHandlers: Record<string, (req: HostRequest) => Promise<void>> = {
        'launchChannel': this.processLaunchChannel.bind(this),
        'requestChannel': this.processRequestChannel.bind(this),
        'infoChannel': this.processInfoChannel.bind(this)
      };

      const handler = channelHandlers[channel];
      if (handler) {
        await handler(hostReq);
      } else {
        console.warn(`[WebViewBridge] Unknown channel: ${channel}`);
      }
    } catch (error) {
      console.error(`[WebViewBridge] Error processing channel ${channel}:`, error);
    }
  }

  private async processLaunchChannel(hostReq: HostRequest): Promise<void> {
    const eventHandlers: Record<string, () => void> = {
      [HostEvent.CLOSE]: () => this.handleClose(hostReq),
      [HostEvent.NATIVE_BACK]: () => this.handleNativeBack(hostReq.params),
      [HostEvent.URL]: () => this.handleUrl(hostReq.params),
      [HostEvent.ANALYTICS]: () => this.handleAnalytics(hostReq)
    };

    const handler = eventHandlers[hostReq.type];
    if (handler) {
      handler();
    } else {
      console.warn(`[WebViewBridge] Unhandled launch event: ${hostReq.type}`);
    }
  }

  private async processRequestChannel(hostReq: HostRequest): Promise<void> {
    const eventHandlers: Record<string, () => Promise<void>> = {
      [HostEvent.DATA]: () => this.handleDataRequest(hostReq),
      [HostEvent.REQUEST_PERMISSION]: () => this.handlePermissionRequest(hostReq)
    };

    const handler = eventHandlers[hostReq.type];
    if (handler) {
      await handler();
    } else {
      console.warn(`[WebViewBridge] Unhandled request event: ${hostReq.type}`);
    }
  }

  private async processInfoChannel(hostReq: HostRequest): Promise<void> {
    // Info channel handling logic
  }

  private handleClose(hostReq: HostRequest): void {
    const orderId = hostReq.params?.orderId;
    if (orderId) {
      console.log('[WebViewBridge] Close with orderId:', orderId);
    }
    this.callbacks.onClose?.();
  }

  private handleNativeBack(params?: Record<string, unknown>): void {
    const control = params?.control as boolean;
    if (control) {
      this.callbacks.onClose?.();
    }
  }

  private handleUrl(params?: Record<string, unknown>): void {
    const url = params?.url as string;
    if (url) {
      console.log('[WebViewBridge] URL navigation requested:', url);
    }
  }

  private handleAnalytics(hostReq: HostRequest): void {
    // Analytics handling logic
  }

  private async handleDataRequest(hostReq: HostRequest): Promise<void> {
    const { params, id } = hostReq;
    if (!params?.key) {
      console.warn('[WebViewBridge] Data request missing key');
      return;
    }

    const key = params.key as string;
    const source = params.source as string || '';
    const messageId = id || '';

    try {
      let result = '';
      
      if (source === 'remote-config') {
        result = await this.onRampService.getRemoteConfigValue(key);
      } else {
        switch (key) {
          case 'transactionId':
            result = await this.onRampService.getTransactionToken();
            break;
          case 'tokenData':
            if (source === this.tokenId) {
              const tokenData = await this.onRampService.getOnRampTokens();
              result = JSON.stringify(tokenData);
            }
            break;
          default:
            console.warn(`[WebViewBridge] Unknown data key: ${key}`);
            return;
        }
      }

      this.sendResponse({
        type: hostReq.type,
        response: { [key]: result },
        source: this.sourceName,
        id: messageId,
      });
    } catch (error) {
      this.sendResponse({
        type: hostReq.type,
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
          [key]: '',
        },
        source: this.sourceName,
        id: messageId,
      });
    }
  }

  private async handlePermissionRequest(hostReq: HostRequest): Promise<void> {
    if (!hostReq.params?.data) {
      console.warn('[WebViewBridge] Permission request missing data');
      return;
    }

    try {
      const requestedPermissions = hostReq.params.data as string[];
      const results: Record<string, boolean> = {};

      for (const permission of requestedPermissions) {
        if (permission === 'camera') {
          const permissionResponse = await this.onRampService.requestCameraPermission();
          results[permission] = permissionResponse.granted;
        }
      }

      this.sendResponse({
        type: HostEvent.REQUEST_PERMISSION,
        response: results,
        source: this.sourceName,
        id: hostReq.id || '',
      });
    } catch (error) {
      this.sendResponse({
        type: HostEvent.REQUEST_PERMISSION,
        response: { error: 'Permission request failed' },
        source: this.sourceName,
        id: hostReq.id || '',
      });
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

  private sendResponse(response: HostResponse): void {
    if (!this.webViewRef.current) {
      console.warn('[WebViewBridge] WebView reference is null');
      return;
    }

    const jsCode = `
      (function() {
        try {
          if (typeof window.responseChannel === 'function') {
            window.responseChannel(${JSON.stringify(response)});
          }
        } catch (error) {
          console.error('[WebView] Error sending response:', error);
        }
      })();
      true;
    `;

    this.webViewRef.current.injectJavaScript(jsCode);
  }

  cleanup(): void {
    this.callbackHandlers.clear();
  }
}