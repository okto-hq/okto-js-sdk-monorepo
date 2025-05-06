import { DEFAULT_WEBVIEW_URL } from '../constants.js';
import type { WebViewOptions } from '../types.js';
import type { WebViewManager } from '../webViewManager.js';
import type { AuthRequestHandler } from './authRequestHandler.js';

/**
 * @description
 * Handles the opening and management of a WebView for authentication purposes.
 * This class is responsible for opening the WebView, handling messages from it,
 * and managing the authentication flow.
 * It uses the WebViewManager to open and close the WebView and the AuthRequestHandler
 * to handle specific authentication requests.
 * It also provides options for customizing the WebView appearance and behavior.
 * The WebView is opened with a default URL that includes the app name and origin.
 * The WebView can be customized with options such as width, height, and event handlers.
 * The class listens for messages from the WebView and processes them using the AuthRequestHandler.
 * The WebView can be closed by calling the closeWebView method.
 * The class also provides a method to destroy the WebViewManager instance.
 * @open webview
 * @close webview
 * @param {WebViewManager} webViewManager - The WebViewManager instance used to manage the WebView.
 * @param {AuthRequestHandler} authRequestHandler - The AuthRequestHandler instance used to handle authentication requests.
 * @param {WebViewOptions} options - Options for customizing the WebView appearance and behavior.
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

  public open(options: WebViewOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const {
        url = `${DEFAULT_WEBVIEW_URL}?app=OKTO_WEB&origin=${window.location.origin}`,
        width = 500,
        height = 800,
        onError,
        onClose,
        onSuccess,
      } = options;

      const isOpened = this.webViewManager.openWebView({
        url,
        width,
        height,
        onSuccess: (data) => {
          onSuccess?.(data);
          resolve();
        },
        onError: (error) => { 
          onError?.(error);
          reject(error);
        },
        onClose: () => {
          onClose?.();
          reject(new Error('Authentication canceled'));
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
        const error = new Error('WebView failed to open. Are popups blocked?');
        onError?.(error);
        return reject(error);
      }

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

          return this.authRequestHandler.handleRequest(actualData);
        } catch (e) {
          console.error('Failed to process WebView event:', e);
        }
      };

      window.addEventListener('message', messageListener);
    });
  }
}
