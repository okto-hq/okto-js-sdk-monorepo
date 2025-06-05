import { DEFAULT_WEBVIEW_URL } from '../constants.js';
import type { WebViewOptions } from '../types.js';
import type { WebViewManager } from '../webViewManager.js';
import type { OnrampRequestHandler } from './onrampRequestHandler.js';

export class OktoOnrampWebView {
  private webViewManager: WebViewManager;
  private onrampRequestHandler: OnrampRequestHandler;

  constructor(
    webViewManager: WebViewManager,
    onrampRequestHandler: OnrampRequestHandler,
  ) {
    this.webViewManager = webViewManager;
    this.onrampRequestHandler = onrampRequestHandler;
  }

  public open(
    options: WebViewOptions = {},
  ): Promise<string | { message: string; data?: string }> {
    return new Promise((resolve, reject) => {
      const { onSuccess, onError, onClose, url } = options;
      const webViewUrl = url || DEFAULT_WEBVIEW_URL;

      const cleanup = () => {
        window.removeEventListener('message', messageListener);
      };

      const handleSuccess = (data: string) => {
        onSuccess?.(data);
        cleanup();
        resolve(data);
      };

      const handleError = (err: Error) => {
        onError?.(err);
        cleanup();
        reject({ message: 'Onramp flow failed', error: err });
      };

      const handleClose = () => {
        onClose?.();
        cleanup();
        reject({ message: 'Onramp flow canceled' });
      };

      const messageListener = async (event: MessageEvent) => {
        if (!this.webViewManager['allowedOrigins']?.includes(event.origin))
          return;
        try {
          const rawData =
            typeof event.data === 'string'
              ? JSON.parse(event.data)
              : event.data;
          const response =
            await this.onrampRequestHandler.handleRequest(rawData);
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

      const isOpened = this.webViewManager.openWebView({
        url: `${webViewUrl}`,
        width: 500,
        height: 800,
        onSuccess: (data) => {
          if (typeof data === 'string') handleSuccess(data);
        },
        onError: handleError,
        onClose: handleClose,
      });

      if (!isOpened) {
        handleError(new Error('WebView failed to open. Are popups blocked?'));
      }
    });
  }
}
