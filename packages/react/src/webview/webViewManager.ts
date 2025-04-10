import {
  CHANNELS,
  DEFAULT_ALLOWED_ORIGINS,
  DEFAULT_IFRAME_STYLE,
  DEFAULT_MODAL_STYLE,
  DEFAULT_REQUEST_TIMEOUT,
} from './constants.js';
import type { WebViewMessage, WebViewOptions } from './types.js';

// WebViewManager.ts
export class WebViewManager {
  private webPopup: Window | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private allowedOrigins?: string[];
  private popupCheckInterval?: number;
  private readonly requestTimeout = DEFAULT_REQUEST_TIMEOUT;
  private debug: boolean;
  private requestHandlers = new Map<string, (data: any) => Promise<any>>();

  private webModal: HTMLDivElement | null = null;
  private webFrame: HTMLIFrameElement | null = null;
  private currentTargetOrigin: string | null = null;

  constructor(debug: boolean = false, allowedOrigins?: string[]) {
    this.debug = debug;
    this.allowedOrigins = allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS;
    // this.setupMessageListener();
    // this.setupWebViewCommunication();
  }

  // Method to handle incoming requests
  public onRequest(method: string, handler: (data: any) => Promise<any>): void {
    this.requestHandlers.set(method, handler);
  }

  private setupMessageListener(): void {
    setTimeout(() => {
      window.addEventListener('message', this.handleMessage);
    }, 0);
  }

  private handleMessage = (event: MessageEvent): void => {
    if (!this.allowedOrigins?.includes(event.origin)) {
      this.debug &&
        console.warn('[WebViewManager] Unauthorized origin:', event.origin);
      return;
    }

    try {
      // Handle both wrapped and direct message formats
      let parsedMessage: WebViewMessage | null = null;

      // 1. Check for nested message structure
      if (event.data.eventName && event.data.eventData) {
        this.debug &&
          console.log('[WebViewManager] Received wrapped message:', event.data);

        try {
          const innerData = JSON.parse(event.data.eventData);
          if (this.validateMessage(innerData)) {
            parsedMessage = innerData;
          }
        } catch (error) {
          this.debug &&
            console.error(
              '[WebViewManager] Failed to parse inner data:',
              error,
            );
        }
      }
      // 2. Check for direct message structure
      else if (this.validateMessage(event.data)) {
        parsedMessage = event.data;
      }

      if (parsedMessage) {
        this.debug &&
          console.log('[WebViewManager] Processing message:', parsedMessage);

        if (parsedMessage.channel === 'requestChannel') {
          this.handleIncomingRequest(parsedMessage);
        } else if (parsedMessage.channel === 'responseChannel') {
          const handler = this.messageHandlers.get(parsedMessage.id);
          if (handler) {
            handler(parsedMessage.data);
            this.messageHandlers.delete(parsedMessage.id);
          }
        }
      } else {
        this.debug &&
          console.warn(
            '[WebViewManager] Unrecognized message format:',
            event.data,
          );
      }
    } catch (error) {
      this.debug &&
        console.error('[WebViewManager] Message processing error:', error);
    }
  };

  // Add this method to better handle WebView communication
  public setupWebViewCommunication(): void {
    // Send a ready signal to the WebView
    this.webPopup?.postMessage(
      {
        type: 'sdk_ready',
        status: 'connected',
      },
      this.targetOrigin,
    );

    // Handle WebView ready state
    window.addEventListener('message', (event) => {
      if (
        event.data?.type === 'webview_ready' &&
        this.allowedOrigins?.includes(event.origin)
      ) {
        this.debug &&
          console.log('[WebViewManager] WebView initialized:', event.data);
        this.webPopup?.postMessage(
          {
            type: 'acknowledge',
            status: 'ready',
          },
          this.targetOrigin,
        );
      }
    });
  }

  // Updated validateMessage
  private validateMessage(message: any): message is WebViewMessage {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.method === 'string' &&
      ['requestChannel', 'responseChannel', 'infoChannel'].includes(
        message.channel,
      )
    );
  }

  public openWebView(options: WebViewOptions = {}): boolean {
    const {
      url = 'https://onboarding.oktostage.com',
      width = 300,
      height = 600,
      onClose,
      modalStyle = {},
      iframeStyle = {},
    } = options;

    this.debug &&
      console.log('[WebViewManager] Opening web view with options:', {
        url,
        width,
        height,
        modalStyle,
        iframeStyle,
      });

    try {
      const urlObj = new URL(url);
      this.currentTargetOrigin = urlObj.origin;

      if (!this.allowedOrigins?.includes(this.currentTargetOrigin)) {
        this.debug && console.error('[WebViewManager] Origin not allowed');
        return false;
      }
    } catch (error) {
      this.debug && console.error('[WebViewManager] Invalid URL:', error);
      return false;
    }

    // Create modal container
    this.webModal = document.createElement('div');
    Object.assign(this.webModal.style, DEFAULT_MODAL_STYLE, modalStyle);

    // Create iframe container
    const iframeContainer = document.createElement('div');
    iframeContainer.style.position = 'relative';
    iframeContainer.style.width = `${width}px`;
    iframeContainer.style.height = `${height}px`;

    // Create iframe
    this.webFrame = document.createElement('iframe');
    Object.assign(this.webFrame.style, DEFAULT_IFRAME_STYLE, iframeStyle);
    this.webFrame.src = url;

    // Assemble elements
    iframeContainer.appendChild(this.webFrame);
    // iframeContainer.appendChild(closeButton);
    this.webModal.appendChild(iframeContainer);
    document.body.appendChild(this.webModal);

    // Event listeners
    const closeHandler = () => {
      this.closeWebView();
      onClose?.();
    };

    // closeButton.addEventListener('click', closeHandler);
    this.webModal.addEventListener('click', (e) => {
      if (e.target === this.webModal) closeHandler();
    });

    return true;
  }

  private validateTargetOrigin(origin: string): string {
    if (!origin) {
      console.warn('No target origin specified, using current origin');
      return window.location.origin;
    }

    try {
      new URL(origin); // Validate it's a proper URL
      return origin;
    } catch {
      console.warn('Invalid origin specified, using current origin');
      this.debug &&
        console.warn('[WebViewManager] Invalid origin, using current origin');
      return window.location.origin;
    }
  }

  // Then update the targetOrigin getter:
  private get targetOrigin(): string {
    return this.validateTargetOrigin(
      this.allowedOrigins?.[3] ?? window.location.origin,
    );
  }

  public sendRequest(method: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isWebViewOpen()) {
        this.debug &&
          console.warn(
            '[WebViewManager] WebView not available for sending request',
          );
        reject(new Error('WebView not available'));
        return;
      }

      const requestId = crypto.randomUUID();

      if (this.debug) {
        console.groupCollapsed(`[WebViewManager] Sending request: ${method}`);
        console.log('Request ID:', requestId);
        console.log('Data:', data);
        console.groupEnd();
      }

      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete(requestId);
        this.debug &&
          console.warn(`[WebViewManager] Request timeout: ${method}`);
        reject(new Error('Request timeout'));
      }, this.requestTimeout);

      this.messageHandlers.set(requestId, (responseData) => {
        clearTimeout(timeoutId);
        this.debug &&
          console.log(
            `[WebViewManager] Received response for ${method}:`,
            responseData,
          );
        responseData.status === 'error'
          ? reject(new Error(responseData.message || 'Request failed'))
          : resolve(responseData);
      });

      this.webFrame?.contentWindow?.postMessage(
        {
          id: requestId,
          method,
          data,
          channel: CHANNELS.REQUEST,
        },
        this.currentTargetOrigin!,
      );
    });
  }

  public sendInfo(method: string, data: any): void {
    if (!this.isWebViewOpen()) {
      console.warn('Cannot send info - WebView closed');
      return;
    }

    this.webFrame?.contentWindow?.postMessage(
      {
        id: crypto.randomUUID(),
        method,
        data,
        channel: CHANNELS.INFO,
      },
      this.currentTargetOrigin!,
    );
  }

  private async handleIncomingRequest(message: WebViewMessage): Promise<void> {
    try {
      this.debug &&
        console.log(
          '[WebViewManager] Dispatching',
          message.method,
          'with ID:',
          message.id,
        );

      const handler = this.requestHandlers.get(message.method);
      if (!handler) {
        this.debug &&
          console.warn(`[WebViewManager] No handler for ${message.method}`);
        return;
      }

      const response = await handler(message.data);
      this.sendResponse(message.id, message.method, response);
    } catch (error) {
      this.sendErrorResponse(
        message.id,
        message.method,
        error instanceof Error ? error.message : 'Request failed',
      );
    }
  }

  public sendResponse(
    id: string,
    method: string,
    data: any,
    error: string | null = null,
  ): void {
    const payload = {
      id,
      method,
      data,
      error,
    };

    const message = JSON.stringify(payload);

    this.debug && console.log('[WebViewManager] Sending response:', message);
    this.webFrame?.contentWindow?.postMessage(message, this.targetOrigin);
  }

  private sendErrorResponse(id: string, method: string, error: string): void {
    this.webFrame?.contentWindow?.postMessage(
      {
        id,
        method,
        error,
        channel: CHANNELS.RESPONSE,
        status: 'error',
      },
      this.targetOrigin,
    );
  }

  public closeWebView(): void {
    if (this.webModal) {
      document.body.removeChild(this.webModal);
      this.webModal = null;
    }
    this.webFrame = null;
    this.currentTargetOrigin = null;
    this.clearPopupCheck();
  }

  public isWebViewOpen(): boolean {
    return !!this.webModal && !!this.webFrame;
  }

  public destroy(): void {
    window.removeEventListener('message', this.handleMessage);
    this.closeWebView();
    this.messageHandlers.clear();
  }

  private clearPopupCheck(): void {
    if (this.popupCheckInterval) {
      clearInterval(this.popupCheckInterval);
      this.popupCheckInterval = undefined;
    }
  }
}
