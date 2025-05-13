import { DEFAULT_WEBVIEW_URL } from '../constants.js';
import type { WebViewOptions } from '../types.js';
import type { WebViewManager } from '../webViewManager.js';
import type { AuthRequestHandler } from './authRequestHandler.js';

/**
 * @description
 * Handles the opening and management of a WebView for authentication purposes.
 * This class is responsible for opening the WebView, handling messages from it,
 * and managing the authentication flow.
 * @open webview
 * @close webview
 * @param {WebViewManager} webViewManager - The WebViewManager instance used to manage the WebView.
 * @param {AuthRequestHandler} authRequestHandler - The AuthRequestHandler instance used to handle authentication requests.
 * @param {WebViewOptions} options - Options for customizing the WebView onSuccess, onError and onClose.
 */
export class OktoAuthWebView {
  private webViewManager: WebViewManager;
  private authRequestHandler: AuthRequestHandler;

  constructor(
    webViewManager: WebViewManager,
    authRequestHandler: AuthRequestHandler,
  ) {
    this.webViewManager = webViewManager;
    this.authRequestHandler = authRequestHandler;
  }

  public open(
    options: WebViewOptions = {},
  ): Promise<string | { message: string; data?: string }> {
    return new Promise((resolve, reject) => {
      const { onSuccess, onError, onClose } = options;
      const cleanup = () => {
        window.removeEventListener('message', messageListener);
      };

      const handleSuccess = (data: string) => {
        try {
          onSuccess?.(data);
        } catch (err) {
          console.error('onSuccess callback failed:', err);
        }
        cleanup();
        resolve(data);
      };

      const handleError = (err: Error) => {
        const payload = { message: 'Authentication failed', error: err };
        try {
          onError?.(new Error(payload.message));
        } catch (callbackErr) {
          console.error('onError callback failed:', callbackErr);
        }
        cleanup();
        reject(payload);
      };

      const handleClose = () => {
        const payload = { message: 'Authentication canceled by the user' };
        try {
          onClose?.();
        } catch (err) {
          console.error('onClose callback failed:', err);
        }
        cleanup();
        reject(payload);
      };

      const messageListener = async (event: MessageEvent) => {
        if (!this.webViewManager['allowedOrigins']?.includes(event.origin)) {
          console.warn('Received message from untrusted origin:', event.origin);
          return;
        }

        try {
          let rawData = event.data;
          if (typeof rawData === 'string') {
            rawData = JSON.parse(rawData);
          }

          const actualData =
            rawData.eventName && rawData.eventData
              ? typeof rawData.eventData === 'string'
                ? JSON.parse(rawData.eventData)
                : rawData.eventData
              : rawData;

          const response =
            await this.authRequestHandler.handleRequest(actualData);
          if (response && typeof response === 'string') {
            this.webViewManager.triggerSuccess(response);
            handleSuccess(response);
          }
        } catch (err) {
          this.webViewManager.triggerError(err as Error);
          handleError(err as Error);
        }
      };

      window.addEventListener('message', messageListener);
      const webViewUrl = options.url;
      const isOpened = this.webViewManager.openWebView({
        url: `${webViewUrl}?app=OKTO_WEB&origin=${window.location.origin}`,
        width: 500,
        height: 800,
        onSuccess: (data) => {
          if (typeof data === 'string') handleSuccess(data);
        },
        onError: handleError,
        onClose: handleClose,
        modalStyle: {
          backgroundColor: 'rgba(0,0,0,0.7)',
        },
        iframeStyle: {
          background: window.matchMedia('(min-width: 500px)').matches
            ? 'transparent'
            : 'white',
          boxShadow: window.matchMedia('(min-width: 500px)').matches
            ? 'none'
            : '0 0 20px rgba(0,0,0,0.3)',
        },
      });

      if (!isOpened) {
        const error = new Error('WebView failed to open. Are popups blocked?');
        handleError(error);
      }
    });
  }
}
