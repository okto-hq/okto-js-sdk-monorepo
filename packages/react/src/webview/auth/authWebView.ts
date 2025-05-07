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
            const successPayload = {
              message: 'Authentication successful',
              data: response,
            };
            onSuccess?.(successPayload);
            cleanup();
            resolve(successPayload);
          }
        } catch (err) {
          console.error('WebView event processing failed:', err);
        }
      };

      const cleanup = () => {
        window.removeEventListener('message', messageListener);
      };

      window.addEventListener('message', messageListener);

      const isOpened = this.webViewManager.openWebView({
        url: `${DEFAULT_WEBVIEW_URL}?app=OKTO_WEB&origin=${window.location.origin}`,
        width: 500,
        height: 800,
        onSuccess: (data) => {
          const successPayload = {
            message: 'Authentication successful',
            data: typeof data === 'string' ? data : undefined,
          };
          try {
            onSuccess?.(successPayload);
            resolve(successPayload);
          } catch (error) {
            console.error('onSuccess callback failed:', error);
            reject(error);
          } finally {
            cleanup();
          }
        },
        onError: (error) => {
          const errorPayload = {
            message: 'Authentication failed',
            error,
          };
          try {
            onError?.(new Error(errorPayload.message));
          } finally {
            cleanup();
            reject(errorPayload);
          }
        },
        onClose: () => {
          const closePayload = {
            message: 'Authentication canceled by the user',
          };
          try {
            onClose?.();
          } finally {
            cleanup();
            reject(new Error(closePayload.message));
          }
        },
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
        cleanup();
        const error = new Error('WebView failed to open. Are popups blocked?');
        const errorPayload = {
          message: 'WebView failed to open',
          error,
        };
        onError?.(new Error(errorPayload.message));
        reject(errorPayload);
      }
    });
  }
}
