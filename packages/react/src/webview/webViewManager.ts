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

/**
 * @description
 * WebViewManager is a class that manages the creation and handling of web views.
 * It provides methods to open, close, and communicate with web views.
 * It also handles incoming messages and manages the lifecycle of the web view.
 * @example
 * const webViewManager = new WebViewManager();
 * webViewManager.openWebView({
 *   url: 'https://example.com',
 *   width: 400,
 *   height: 600,
 *   onClose: () => {
 *     console.log('Web view closed');
 *   },
 *   modalStyle: {
 *     backgroundColor: 'rgba(0, 0, 0, 0.5)',
 *   },
 *   iframeStyle: {
 *     border: 'none',
 *   },
 * });
 */
export class WebViewManager {
  private webPopup: Window | null = null;
  private messageHandlers: Map<string, (data: unknown) => void> = new Map();
  private allowedOrigins?: string[];
  private popupCheckInterval?: number;
  private readonly requestTimeout = DEFAULT_REQUEST_TIMEOUT;
  private debug: boolean;
  private requestHandlers = new Map<
    string,
    (data: unknown) => Promise<unknown>
  >();

  private onCloseCallback?: () => void;
  private onErrorCallback?: (error: Error) => void;
  private onSuccessCallback?: (data: string) => void;

  private webModal: HTMLDivElement | null = null;
  private webFrame: HTMLIFrameElement | null = null;
  private currentTargetOrigin: string | null = null;

  constructor(
    debug: boolean = false,
    options: WebViewOptions = {},
    allowedOrigins?: string[],
  ) {
    this.debug = debug;
    this.allowedOrigins = allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS;
    this.onCloseCallback = options.onClose;
    this.onSuccessCallback = options.onSuccess;
    this.onErrorCallback = options.onError;
  }

  /**
   * @openWebView
   * Opens a web view with the specified options.
   * @description
   * This method creates a modal with an iframe that loads the specified URL.
   * It also sets up event listeners for messages from the iframe and handles
   * closing the modal.
   * @param url The URL to load in the web view.
   * @param width The width of the web view.
   * @param height The height of the web view.
   * @param onClose Callback function to be called when the web view is closed.
   * @param modalStyle Additional styles for the modal.
   * @param iframeStyle Additional styles for the iframe.
   * @param allowedOrigins List of allowed origins for the web view.
   * @param debug Enable debug mode for development.
   * @param onSuccess Callback function to be called on successful login.
   * @param onError Callback function to be called on login error.
   * @returns True if the web view was opened successfully, false otherwise.
   * @param options The options for the web view.
   * @returns
   */
  public openWebView(options: WebViewOptions = {}) {
    const {
      url = DEFAULT_WEBVIEW_URL as string,
      width = undefined,
      height = undefined,
      onClose,
      onSuccess,
      onError,
      modalStyle = {},
      iframeStyle = {},
    } = options;

    if (this.debug) {
      console.log('[WebViewManager] Opening web view with options:', {
        url,
        width,
        height,
        modalStyle,
        iframeStyle,
      });
    }

    try {
      const urlObj = new URL(url);
      this.currentTargetOrigin = urlObj.origin;

      if (!this.allowedOrigins?.includes(this.currentTargetOrigin)) {
        if (this.debug) {
          console.error('[WebViewManager] Origin not allowed');
        }
        return false;
      }
    } catch (error) {
      if (this.debug) {
        console.error('[WebViewManager] Invalid URL:', error);
      }
      return false;
    }

    this.webModal = document.createElement('div');
    Object.assign(this.webModal.style, DEFAULT_MODAL_STYLE, modalStyle, {
      opacity: '0',
      transition: 'opacity 0.5s ease',
    });

    const iframeContainer = document.createElement('div');
    iframeContainer.style.position = 'relative';
    iframeContainer.style.width = width ? `${width}px` : '100%';
    iframeContainer.style.height = height ? `${height}px` : '100%';

    this.webFrame = document.createElement('iframe');
    Object.assign(this.webFrame.style, DEFAULT_IFRAME_STYLE, iframeStyle);
    this.webFrame.src = url;

    iframeContainer.appendChild(this.webFrame);
    this.webModal.appendChild(iframeContainer);
    document.body.appendChild(this.webModal);

    // Animate in
    requestAnimationFrame(() => {
      this.webModal!.style.opacity = '1';
    });

    const closeHandler = () => {
      this.webModal!.style.opacity = '0';
      setTimeout(() => {
        this.closeWebView();
        onClose?.();
      }, 300);
    };

    // Modal click-to-close
    this.webModal.addEventListener('click', (e) => {
      if (e.target === this.webModal) closeHandler();
    });

    // Attach postMessage listener for onSuccess and onError
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== this.currentTargetOrigin) return;

      const { channel, data } = event.data ?? {};

      if (this.debug) {
        console.log('[WebViewManager] Received message:', event.data);
      }

      if (channel === CHANNELS.RESPONSE) {
        if (data?.status === 'success') {
          onSuccess?.(data);
          window.removeEventListener('message', messageHandler);
        } else if (data?.status === 'error') {
          onError?.(data);
          window.removeEventListener('message', messageHandler);
        }
      }
    };

    window.addEventListener('message', messageHandler);

    return true;
  }

  /**
   * @description
   * Validates the target origin for the web view.
   * If no origin is specified, it defaults to the current window's origin.
   * If the specified origin is invalid, it also defaults to the current window's origin.
   * @param origin The target origin to validate.
   * @returns
   */
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
      if (this.debug) {
        console.warn('[WebViewManager] Invalid origin, using current origin');
      }
      return window.location.origin;
    }
  }

  /**
   * @description
   * Sets the target origin for the web view.
   * If no origin is specified, it defaults to the current window's origin.
   * If the specified origin is invalid, it also defaults to the current window's origin.
   * @returns targetOrigin on which the web view is opened
   */
  private get targetOrigin(): string {
    return this.validateTargetOrigin(
      this.currentTargetOrigin ??
        TARGET_ORIGIN_RESPONSE ??
        this.allowedOrigins?.[0] ??
        window.location.origin,
    );
  }

  /**
   * @description
   * Handles incoming messages from the web view.
   * @param method The method name to handle.
   * @param handler The handler function to call when the method is invoked.
   * @returns void
   * @example
   * webViewManager.onRequest('exampleMethod', async (data) => {
   *   return { success: true };
   * });
   */
  public onRequest(
    method: string,
    handler: (data: unknown) => Promise<unknown>,
  ): void {
    this.requestHandlers.set(method, handler);
  }

  /**
   * @description
   * Sends a request to the web view and returns a promise that resolves with the response.
   * @param method The method name to call.
   * @param data The data to send with the request.
   * @returns A promise that resolves with the response data.
   * @example
   * webViewManager.sendRequest('exampleMethod', { key: 'value' })
   *   .then((response) => {
   *     console.log('Response:', response);
   *   })
   *   .catch((error) => {
   *     console.error('Error:', error);
   *   });
   * @throws Error if the web view is not open or if the request times out.
   * @throws Error if the request fails.
   * @throws Error if the web view is not available.
   * @throws Error if the request times out.
   * @throws Error if the request fails.
   */
  public sendRequest(method: string, data: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.isWebViewOpen()) {
        if (this.debug) {
          console.warn(
            '[WebViewManager] WebView not available for sending request',
          );
        }
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
        if (this.debug) {
          console.warn(`[WebViewManager] Request timeout: ${method}`);
        }
        reject(new Error('Request timeout'));
      }, this.requestTimeout);

      this.messageHandlers.set(requestId, (responseData) => {
        clearTimeout(timeoutId);
        if (this.debug) {
          console.log(
            `[WebViewManager] Received response for ${method}:`,
            responseData,
          );
        }
        if (
          typeof responseData === 'object' &&
          responseData !== null &&
          'status' in responseData
        ) {
          if (responseData.status === 'error') {
            reject(
              new Error(
                (responseData as { message?: string }).message ||
                  'Request failed',
              ),
            );
          } else {
            resolve(responseData);
          }
        } else {
          reject(new Error('Invalid response data'));
        }
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

  /**
   * @description
   * Sends information to the web view.
   * @param method The method name to call.
   * @param data The data to send with the request.
   * @returns void
   * @example
   * webViewManager.sendInfo('exampleMethod', { key: 'value' });
   */
  public sendInfo(method: string, data: unknown): void {
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

  /**
   * @description
   * Sends a response to the web view.
   * This method is used to send data back to the web view after processing a request.
   * @param id The ID of the request to respond to.
   * @param method The method name to call.
   * @param data The data to send with the response.
   * @param error An optional error message to include in the response.
   * @returns void
   * @example
   * webViewManager.sendResponse(
   *  'requestId',
   *  'exampleMethod',
   *  { key: 'value' },
   *   null,
   * );
   * @throws Error if the web view is not open.
   * @throws Error if the request ID is not valid.
   * @throws Error if the method name is not valid.
   * @throws Error if the data is not valid.
   * @throws Error if the error message is not valid.
   * @throws Error if the web view is not available.
   */
  public sendResponse(id: string, method: string, data: unknown): void {
    const payload = {
      id,
      method,
      data,
    };

    const message = JSON.stringify(payload);

    if (this.debug) {
      console.groupCollapsed(`[WebViewManager] Sending response: ${method}`);
      console.log('Request ID:', id);
      console.log('Data:', data);
      console.groupEnd();
    }
    this.webFrame?.contentWindow?.postMessage(message, this.targetOrigin);
  }

  /**
   * @description
   * Sends an error response to the web view.
   * @param id The ID of the request to respond to.
   * @param method The method name to call.
   * @param error The error message to include in the response.
   * @returns void
   * @example
   * webViewManager.sendErrorResponse('requestId', 'exampleMethod', 'An error occurred');
   */
  public sendErrorResponse(
    id: string,
    method: string,
    data: unknown,
    error: string,
  ): void {
    const payload = {
      id,
      method,
      data: JSON.stringify({ data }),
      error: error,
    };

    const message = payload;

    if (this.debug) {
      console.groupCollapsed(`[WebViewManager] Sending response: ${method}`);
      console.log('Request ID:', id);
      console.log('Data:', data);
      console.log('Error:', error);
      console.groupEnd();
    }
    this.webFrame?.contentWindow?.postMessage(message, this.targetOrigin);
  }

  /**
   * @description
   * Closes the web view and removes the modal from the DOM.
   * This method also clears any pending popup checks.
   * @returns void
   * @example
   * webViewManager.closeWebView();
   */
  public closeWebView(options: { triggerCallback?: boolean } = {}): void {
    const { triggerCallback = true } = options;
    if (this.webModal) {
      // fade-out animation
      this.webModal.style.opacity = '0';

      // Wait for the animation to complete before removing the modal
      setTimeout(() => {
        if (this.webModal) {
          document.body.removeChild(this.webModal);
          this.webModal = null;
        }
        this.webFrame = null;
        this.currentTargetOrigin = null;
        this.clearPopupCheck();
      }, 300);
      if (triggerCallback && this.onCloseCallback) {
        this.onCloseCallback();
      }
    }
  }
  /**
   * @description
   * Sets the callback function to be called when the web view is closed.
   * @param callback The callback function to set.
   * @returns void
   * @example
   * webViewManager.setOnCloseCallback(() => {
   *   console.log('Web view closed');
   * });
   */
  public setOnCloseCallback(callback: () => void) {
    this.onCloseCallback = callback;
  }

  /**
   * @description
   * Sets the callback function to be called when an error occurs in the web view.
   * @param callback The callback function to set.
   * @returns void
   * @example
   * webViewManager.setOnErrorCallback((error) => {
   *   console.error('Web view error:', error);
   * });
   */
  public setOnErrorCallback(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * @description
   * Sets the callback function to be called when the web view is successful.
   * @param callback The callback function to set.
   * @returns void
   * @example
   * webViewManager.setOnSuccessCallback((data) => {
   *   console.log('Web view success:', data);
   * });
   */
  public setOnSuccessCallback(callback: (data: string) => void): void {
    this.onSuccessCallback = callback;
  }

  /**
   * @description
   * Triggers an error in the web view.
   * This method is used to handle errors that occur during the web view's lifecycle.
   * @param error The error to trigger.
   * @returns void
   * @example
   * webViewManager.triggerError(new Error('An error occurred'));
   */
  public triggerError(error: Error): void {
    this.onErrorCallback?.(error);
  }

  /**
   * @description
   * Triggers a success in the web view.
   * This method is used to handle successful events that occur during the web view's lifecycle.
   * @param data The data to trigger.
   * @returns void
   * @example
   * webViewManager.triggerSuccess('Success message');
   */
  public triggerSuccess(data: string): void {
    this.onSuccessCallback?.(data);
  }

  /**
   * @description
   * Checks if the web view is open.
   * This method returns true if the web view is open and false otherwise.
   * @returns boolean
   * @example
   * const isOpen = webViewManager.isWebViewOpen();
   * console.log('Is web view open:', isOpen);
   * @throws Error if the web view is not open.
   * @throws Error if the web view is not available.
   */
  public isWebViewOpen(): boolean {
    return !!this.webModal && !!this.webFrame;
  }

  /**
   * @description
   * Destroys the web view manager and clears any pending requests.
   * This method also closes the web view and clears any pending popup checks.
   * @returns void
   * @example
   * webViewManager.destroy();
   * console.log('Web view manager destroyed');
   * @throws Error if the web view manager is not available.
   * @throws Error if the web view is not open.
   * @throws Error if the web view is not available.
   */
  public destroy(): void {
    this.closeWebView();
    this.messageHandlers.clear();
  }

  /**
   * @description
   * Sets up a check for the popup window.
   * This method checks if the popup window is closed and clears the interval if it is.
   * @param interval The interval ID to clear.
   * @returns void
   * @example
   * webViewManager.setupPopupCheck();
   */
  private clearPopupCheck(): void {
    if (this.popupCheckInterval) {
      clearInterval(this.popupCheckInterval);
      this.popupCheckInterval = undefined;
    }
  }
}
