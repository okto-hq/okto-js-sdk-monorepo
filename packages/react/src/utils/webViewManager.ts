// WebViewManager.ts

interface WebViewMessage {
  id: string;
  method: string;
  channel: 'requestChannel' | 'responseChannel' | 'infoChannel';
  data?: any;
  status?: 'success' | 'error';
  message?: string;
}
// First, let's define an interface for the WebView request structure
export interface WebViewRequest {
  eventName?: string;
  eventData?: string;
  [key: string]: any;
}

// Define the interface for the WebView interaction
export interface WebViewOptions {
  url?: string;
  width?: number;
  height?: number;
  onSuccess?: (user: any) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export class WebViewManager {
  private webPopup: Window | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private allowedOrigins: string[];
  private popupCheckInterval?: number;
  private readonly requestTimeout = 30000;
  private debug: boolean;
  private requestHandlers = new Map<string, (data: any) => Promise<any>>();
  private connectHandlers = new Map<string, () => void>();

  constructor(
    allowedOrigins: string[] = ['https://onboarding.oktostage.com'],
    debug: boolean = false,
  ) {
    this.allowedOrigins = allowedOrigins;
    this.debug = debug;
    // this.setupMessageListener();
    // this.setupWebViewCommunication();
    // this.setupConnectHandler();
  }
  private setupConnectHandler(): void {
    window.addEventListener('message', (event) => {
      if (this.allowedOrigins.includes(event.origin)) {
        try {
          const message = JSON.parse(event.data);
          if (message.eventName === 'connect') {
            this.debug &&
              console.log('[WebViewManager] Connect event received');
            this.connectHandlers.forEach((handler) => handler());
          }
        } catch (error) {
          this.debug &&
            console.error('[WebViewManager] Connect event parse error:', error);
        }
      }
    });
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
    if (!this.allowedOrigins.includes(event.origin)) {
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
        this.allowedOrigins.includes(event.origin)
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
      width = 800,
      height = 600,
      onClose,
    } = options;

    this.debug &&
      console.log('[WebViewManager] Opening web view with options:', {
        url,
        width,
        height,
      });

    // this.closeWebView();

    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    this.webPopup = window.open(
      url,
      'OktoWebView',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`,
    );

    if (!this.webPopup) {
      this.debug &&
        console.error('[WebViewManager] Popup blocked or failed to open');
      return false;
    }

    if (onClose) {
      this.popupCheckInterval = window.setInterval(() => {
        if (this.webPopup && !this.webPopup.closed) return;
        this.clearPopupCheck();
        this.webPopup = null;
        onClose();
      }, 500);
    }

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
      this.allowedOrigins[2] || window.location.origin,
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

      // Fixed postMessage call
      this.webPopup!.postMessage(
        {
          id: requestId,
          method,
          data,
          channel: 'requestChannel',
        },
        this.targetOrigin,
      );
    });
  }

  public sendInfo(method: string, data: any): void {
    if (!this.isWebViewOpen()) {
      console.warn('Cannot send info - WebView closed');
      return;
    }

    // Fixed postMessage call
    this.webPopup!.postMessage(
      {
        id: crypto.randomUUID(),
        method,
        data,
        channel: 'infoChannel',
      },
      this.targetOrigin,
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

  public sendResponse(id: string, method: string, data: any): void {
    this.webPopup?.postMessage(
      {
        id,
        method,
        data,
        channel: 'responseChannel',
        status: 'success',
      },
      this.targetOrigin,
    );
  }

  private sendErrorResponse(id: string, method: string, error: string): void {
    this.webPopup?.postMessage(
      {
        id,
        method,
        error,
        channel: 'responseChannel',
        status: 'error',
      },
      this.targetOrigin,
    );
  }

  public closeWebView(): void {
    if (this.webPopup && !this.webPopup.closed) {
      this.webPopup.close();
    }
    this.webPopup = null;
    this.clearPopupCheck();
  }

  public isWebViewOpen(): boolean {
    return !!this.webPopup && !this.webPopup.closed;
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
