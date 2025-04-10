import { DEFAULT_WEBVIEW_URL } from '../constants.js';
import type { WebViewOptions } from '../types.js';
import type { WebViewManager } from '../webViewManager.js';

export const oktoAuthWebView = (
  webViewManager: WebViewManager,
  requestHandler: (data: any) => void,
  options: WebViewOptions = {},
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const {
      url = `${DEFAULT_WEBVIEW_URL}?app=OKTO_WEB&origin=${window.location.origin}`,
      width = 300,
      height = 600,
      onSuccess,
      onError,
      onClose,
    } = options;

    const isOpened = webViewManager.openWebView({
      url,
      width,
      height,
      onClose: () => {
        onClose?.();
        reject(new Error('Authentication canceled'));
      },
      modalStyle: {
        backgroundColor: 'rgba(0,0,0,0.7)',
      },
      iframeStyle: {
        background: 'white',
        boxShadow: '0 0 20px rgba(0,0,0,0.3)',
      },
    });

    if (!isOpened) {
      const error = new Error('WebView failed to open. Are popups blocked?');
      onError?.(error);
      return reject(error);
    }

    // Listen for postMessage events
    const messageListener = (event: MessageEvent) => {
      if (!webViewManager['allowedOrigins']?.includes(event.origin)) return;

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

        requestHandler(actualData);
      } catch (e) {
        console.error('Failed to process WebView event:', e);
      }
    };

    window.addEventListener('message', messageListener);
  });
};
