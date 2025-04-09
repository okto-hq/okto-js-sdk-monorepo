import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import {
  clearLocalStorage,
  getLocalStorage,
  setLocalStorage,
} from 'src/utils/storageUtils.js';
import {
  WebViewManager,
  type WebViewOptions,
} from '../utils/webViewManager.js';

class OktoClient extends OktoCoreClient {
  private webViewManager: WebViewManager;

  constructor(config: OktoClientConfig) {
    super(config);
    this.initializeSession();
    this.webViewManager = new WebViewManager(
      [
        'https://onboarding.oktostage.com',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://localhost:3001',
      ],
      true,
    );
  }

  private async initializeSession(): Promise<void> {
    const session = await getLocalStorage('okto_session');
    if (session) {
      this.setSessionConfig(JSON.parse(session));
      this.syncUserKeys();
    }
  }

  public async authenticateWithWebView(
    options: WebViewOptions = {},
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const {
        url = `http://localhost:3001?app=OKTO_WEB&origin=${window.location.origin}`,
        width = 300,
        height = 600,
        onSuccess,
        onError,
        onClose,
      } = options;

      // Open the iframe-based WebView
      const isOpened = this.webViewManager.openWebView({
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
      // Add a message listener to capture and log all messages
      const messageListener = (event: MessageEvent) => {
        if (!this.webViewManager['allowedOrigins'].includes(event.origin))
          return;

        console.log('Raw WebView Message:', event.data);

        try {
          let rawData = event.data;

          if (typeof rawData === 'string') {
            rawData = JSON.parse(rawData);
          }

          let actualData = rawData;

          if (rawData.eventName && rawData.eventData) {
            console.log('Received wrapped format');
            console.log('WebView Event Structure:', {
              eventName: rawData.eventName,
              eventData: rawData.eventData,
            });

            if (typeof rawData.eventData === 'string') {
              actualData = JSON.parse(rawData.eventData);
            } else {
              actualData = rawData.eventData;
            }
          }

            console.log('WebView Event Structure:', actualData);

          // Send the response back to the WebView
          if (actualData.data?.type === 'request_otp') {
            this.webViewManager.sendResponse(
              actualData.id || 'uuid-for-webview',
              actualData.method || 'okto_sdk_login',
              {
                provider: actualData.data.provider,
                whatsapp_number: actualData.data.whatsapp_number,
                token: 'bsdbcgsdjhgfjhsd',
              },
              null, // or error string if there's an error
            );
          }else if(actualData.data?.type === 'close_webview'){
            this.webViewManager.closeWebView();
          }
        } catch (e) {
          console.error('Failed to process WebView event:', e);
        }
      };

      // Add the message listener
      window.addEventListener('message', messageListener);
    });
  }

  override loginUsingOAuth(
    data: AuthData,
    onSuccess?: (session: SessionConfig) => void,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data, (session) => {
      setLocalStorage('okto_session', JSON.stringify(session));
      this.setSessionConfig(session);
      onSuccess?.(session);
    });
  }

  override sessionClear(): void {
    clearLocalStorage('okto_session');
    return super.sessionClear();
  }

  public closeWebView(): void {
    this.webViewManager.closeWebView();
  }

  public destroy(): void {
    this.webViewManager.destroy();
  }
}

export { OktoClient };
export type { OktoClientConfig };
