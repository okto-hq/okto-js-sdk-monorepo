import {
  CHANNELS,
  DEFAULT_ALLOWED_ORIGINS,
  DEFAULT_IFRAME_STYLE,
  DEFAULT_MODAL_STYLE,
  DEFAULT_REQUEST_TIMEOUT,
  DEFAULT_WEBVIEW_URL,
  TARGET_ORIGIN_RESPONSE,
} from './constants.js';
import type { WebViewOptions } from './types.js';

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
  }
  
  public onRequest(method: string, handler: (data: any) => Promise<any>): void {
    this.requestHandlers.set(method, handler);
  }

  public openWebView(options: WebViewOptions = {}): boolean {
    const {
      url = DEFAULT_WEBVIEW_URL as string,
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

  private get targetOrigin(): string {
    return this.validateTargetOrigin(
      TARGET_ORIGIN_RESPONSE ?? this.allowedOrigins?.[0] ?? window.location.origin,
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
