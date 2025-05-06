import { DEFAULT_WEBVIEW_URL } from '../constants.js';
import type { WebViewResponseOptions } from '../types.js';
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
 * @param {WebViewResponseOptions} options - Options for customizing the WebView onSuccess, onError and onClose.
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
    options: WebViewResponseOptions = {},
  ): Promise<string | { message: string }> {
    return new Promise((resolve, reject) => {
      const { onError, onClose, onSuccess } = options;

      const messageListener = (event: MessageEvent) => {
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

          this.authRequestHandler.handleRequest(actualData);
        } catch (e) {
          console.error('Failed to process WebView event:', e);
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
          try {
            cleanup();
            const successResponse = {
              message: 'Authentication successful',
              data,
            };
            onSuccess?.(successResponse);
            resolve(successResponse);
          } catch (error) {
            cleanup();
            console.error('Error in onSuccess callback:', error);
            reject(error);
          }
        },
        onError: (error) => {
          cleanup();
          const errorResponse = {
            message: 'Authentication failed',
            error,
          };
          onError?.(new Error(errorResponse.message));
          reject(errorResponse);
        },
        onClose: () => {
          cleanup();
          const closeResponse = {
            message: 'Authentication canceled by the user',
          };
          onClose?.();
          reject(new Error(closeResponse.message));
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
        const errorResponse = {
          message: 'WebView failed to open',
          error,
        };
        onError?.(new Error(errorResponse.message));
        return reject(errorResponse);
      }
    });
  }
}
