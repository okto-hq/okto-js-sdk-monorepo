import type { MutableRefObject } from 'react';
import type { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { OnrampCallbacks } from './types.js';
import type { OnRampService } from './onRampService.js';

// Host Request/Response Interfaces
interface HostReqIntf {
  type: string;
  id?: string;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

interface HostResIntf {
  type: string;
  id?: string;
  response?: Record<string, unknown>;
  source?: string;
  [key: string]: unknown;
}

// Channel Event Structure
interface ChannelEvent {
  eventName: string;
  eventData: string;
}

// Host Events Enum
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

// App Name Enum
enum AppNameEnum {
  OktoWeb = 'okto_web'
}

export class WebViewBridge {
  private readonly webViewRef: MutableRefObject<WebView | null>;
  private readonly callbacks: OnrampCallbacks;
  private readonly onRampService: OnRampService;
  private readonly tokenId: string;
  private readonly SOURCE_NAME = AppNameEnum.OktoWeb;
  private readonly callbackHandlers = new Map<string, (res: HostResIntf) => void>();

  constructor(
    webViewRef: MutableRefObject<WebView | null>,
    callbacks: OnrampCallbacks,
    onRampService: OnRampService,
    tokenId: string,
  ) {
    console.log('[WebViewBridge] Initializing with channels pattern:', {
      webViewRef: !!webViewRef.current,
      callbacks: Object.keys(callbacks),
      tokenId,
    });

    this.webViewRef = webViewRef;
    this.callbacks = callbacks;
    this.onRampService = onRampService;
    this.tokenId = tokenId;

    this.setupChannels();
  }

  private setupChannels(): void {
    // Inject JavaScript handlers for all channels
    const injectedJS = `
      (function() {
        console.log('[WebView] Setting up channels...');
        
        // Global handlers for channels
        window.launchChannel = {
          postMessage: function(data) {
            console.log('[WebView] launchChannel received:', data);
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              channel: 'launchChannel',
              data: data
            }));
          }
        };

        window.requestChannel = {
          postMessage: function(data) {
            console.log('[WebView] requestChannel received:', data);
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              channel: 'requestChannel',
              data: data
            }));
          }
        };

        window.infoChannel = {
          postMessage: function(data) {
            console.log('[WebView] infoChannel received:', data);
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              channel: 'infoChannel',
              data: data
            }));
          }
        };

        // Response channel for sending data back to WebView
        window.responseChannel = function(hostRes) {
          console.log('[WebView] responseChannel called with:', hostRes);
          // This will be handled by the web app's callback system
        };

        console.log('[WebView] All channels setup complete');
      })();
      true;
    `;

    // Inject the channel setup script
    this.webViewRef.current?.injectJavaScript(injectedJS);
  }

  async handleMessage(event: WebViewMessageEvent): Promise<void> {
    try {
      console.log('[WebViewBridge] Raw message received:', event.nativeEvent.data);
      
      const message = this.parseMessage(event.nativeEvent.data);
      if (!message) return;

      // Handle channel-based messages
      if (message.channel) {
        await this.handleChannelMessage(message.channel, message.data);
        return;
      }

      // Fallback for direct messages (backward compatibility)
      await this.handleDirectMessage(message);
    } catch (error) {
      console.error('[WebViewBridge] Error handling message:', error);
    }
  }

  private async handleChannelMessage(channel: string, data: string): Promise<void> {
    console.log(`[WebViewBridge] Processing channel: ${channel}`);
    
    try {
      const hostReq: HostReqIntf = JSON.parse(data);
      
      switch (channel) {
        case 'launchChannel':
          await this.processLaunchChannel(hostReq);
          break;
        case 'requestChannel':
          await this.processRequestChannel(hostReq);
          break;
        case 'infoChannel':
          await this.processInfoChannel(hostReq);
          break;
        default:
          console.warn(`[WebViewBridge] Unknown channel: ${channel}`);
      }
    } catch (error) {
      console.error(`[WebViewBridge] Error processing channel ${channel}:`, error);
    }
  }

  private async processLaunchChannel(hostReq: HostReqIntf): Promise<void> {
    console.log('[WebViewBridge] Processing launch channel:', hostReq.type);

    switch (hostReq.type) {
      case HostEvent.CLOSE:
        this.handleClose(hostReq);
        break;
      case HostEvent.NATIVE_BACK:
        this.handleNativeBack(hostReq.params);
        break;
      case HostEvent.URL:
        this.handleUrl(hostReq.params);
        break;
      case HostEvent.ANALYTICS:
        this.handleAnalytics(hostReq);
        break;
      default:
        console.warn(`[WebViewBridge] Unhandled launch event: ${hostReq.type}`);
    }
  }

  private async processRequestChannel(hostReq: HostReqIntf): Promise<void> {
    console.log('[WebViewBridge] Processing request channel:', hostReq.type);

    switch (hostReq.type) {
      case HostEvent.DATA:
        await this.handleDataRequest(hostReq);
        break;
      case HostEvent.REQUEST_PERMISSION:
        await this.handlePermissionRequest(hostReq);
        break;
      default:
        console.warn(`[WebViewBridge] Unhandled request event: ${hostReq.type}`);
    }
  }

  private async processInfoChannel(hostReq: HostReqIntf): Promise<void> {
    console.log('[WebViewBridge] Processing info channel:', hostReq.type);
    
    // Info channel typically used for analytics or logging
    // Add specific info handling logic here if needed
  }

  private handleClose(hostReq: HostReqIntf): void {
    console.log('[WebViewBridge] Handling close event');
    
    // Extract orderId if present in params
    const orderId = hostReq.params?.orderId;
    if (orderId) {
      console.log('[WebViewBridge] Close with orderId:', orderId);
    }
    
    this.callbacks.onClose?.();
  }

  private handleNativeBack(params?: Record<string, unknown>): void {
    console.log('[WebViewBridge] Handling native back:', params);
    
    const control = params?.control as boolean;
    if (control) {
      // Handle controlled back navigation
      this.callbacks.onClose?.();
    }
  }

  private handleUrl(params?: Record<string, unknown>): void {
    console.log('[WebViewBridge] Handling URL navigation:', params);
    
    const url = params?.url as string;
    const openApp = params?.openApp as boolean;
    const appName = params?.name as string;
    
    if (url) {
      // Handle URL navigation logic
      // This could trigger app opening or in-app navigation
      console.log('[WebViewBridge] URL navigation requested:', { url, openApp, appName });
    }
  }

  private handleAnalytics(hostReq: HostReqIntf): void {
    console.log('[WebViewBridge] Handling analytics event:', hostReq);
    // Implement analytics handling if needed
  }

  private async handleDataRequest(hostReq: HostReqIntf): Promise<void> {
    console.log('[WebViewBridge] Processing data request:', hostReq);

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
            console.warn(`[WebViewBridge] Unknown data key: ${key}`);
            return;
        }
      }

      console.log('[WebViewBridge] Data request successful:', {
        key,
        resultLength: result.length,
      });

      this.sendResponse({
        type: hostReq.type,
        response: { [key]: result },
        source: this.SOURCE_NAME,
        id: messageId,
      });
    } catch (error) {
      console.error('[WebViewBridge] Data request failed:', error);
      
      this.sendResponse({
        type: hostReq.type,
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
          [key]: '',
        },
        source: this.SOURCE_NAME,
        id: messageId,
      });
    }
  }

  private async handlePermissionRequest(hostReq: HostReqIntf): Promise<void> {
    console.log('[WebViewBridge] Processing permission request:', hostReq);

    if (!hostReq.params?.data) {
      console.warn('[WebViewBridge] Permission request missing data');
      return;
    }

    try {
      const requestedPermissions = hostReq.params.data as string[];
      const results: Record<string, any> = {};

      for (const permission of requestedPermissions) {
        if (permission === 'camera') {
          const permissionResult = await this.onRampService.requestCameraPermission();
          results[permission] = permissionResult;
        }
        // Add other permission types as needed
      }

      this.sendResponse({
        type: HostEvent.REQUEST_PERMISSION,
        response: results,
        source: this.SOURCE_NAME,
        id: hostReq.id || '',
      });
    } catch (error) {
      console.error('[WebViewBridge] Permission request failed:', error);
      
      this.sendResponse({
        type: HostEvent.REQUEST_PERMISSION,
        response: { error: 'Permission request failed' },
        source: this.SOURCE_NAME,
        id: hostReq.id || '',
      });
    }
  }

  private async handleDirectMessage(message: any): Promise<void> {
    // Backward compatibility for direct messages
    console.log('[WebViewBridge] Processing direct message:', message.type);
    
    // Convert direct message to channel format and process
    const hostReq: HostReqIntf = {
      type: message.type,
      id: message.id,
      params: message.params,
    };

    // Route based on message type
    switch (message.type) {
      case HostEvent.DATA:
        await this.handleDataRequest(hostReq);
        break;
      case HostEvent.CLOSE:
        this.handleClose(hostReq);
        break;
      case HostEvent.REQUEST_PERMISSION:
        await this.handlePermissionRequest(hostReq);
        break;
      default:
        console.warn(`[WebViewBridge] Unhandled direct message: ${message.type}`);
    }
  }

  private parseMessage(data: string): any | null {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('[WebViewBridge] Error parsing message:', error);
      return null;
    }
  }

  private sendResponse(response: HostResIntf): void {
    try {
      console.log('[WebViewBridge] Sending response:', {
        type: response.type,
        id: response.id,
        source: response.source,
      });

      if (!this.webViewRef.current) {
        console.warn('[WebViewBridge] WebView reference is null, cannot send response');
        return;
      }

      // Send response back to WebView via responseChannel
      const jsCode = `
        (function() {
          try {
            if (typeof window.responseChannel === 'function') {
              window.responseChannel(${JSON.stringify(response)});
              console.log('[WebView] Response sent via responseChannel');
            } else {
              console.warn('[WebView] responseChannel not available');
            }
          } catch (error) {
            console.error('[WebView] Error sending response:', error);
          }
        })();
        true;
      `;

      this.webViewRef.current.injectJavaScript(jsCode);
    } catch (error) {
      console.error('[WebViewBridge] Failed to send response:', error);
    }
  }

  cleanup(): void {
    console.log('[WebViewBridge] Cleaning up...');
    this.callbackHandlers.clear();
  }
}