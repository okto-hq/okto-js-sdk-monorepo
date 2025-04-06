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
  type WebViewRequest,
} from '../utils/webViewManager.js';

class OktoClient extends OktoCoreClient {
  private webViewManager: WebViewManager;

  constructor(config: OktoClientConfig) {
    super(config);
    this.initializeSession();
    this.webViewManager = new WebViewManager(
      ['https://onboarding.oktostage.com', 'http://localhost:3000', 'http://127.0.0.1:5500'],
      true, // Enable debug logging
    );
    this.setupRequestHandler();
  }

  private async initializeSession(): Promise<void> {
    const session = await getLocalStorage('okto_session');
    if (session) {
      this.setSessionConfig(JSON.parse(session));
      this.syncUserKeys();
    }
  }

  private setupRequestHandler(): void {
    this.webViewManager.onRequest('okto_sdk_login', async (request: any) => {
      // Log the request in the format you requested
      console.log('WebView Request Received:', {
        eventName: 'requestChannel',
        eventData: JSON.stringify({
          id: crypto.randomUUID(),
          method: 'okto_sdk_login',
          data: request,
        }),
      });
    });
  }

  /**
   * Main method exposed to the application to handle WebView authentication
   * This method handles the entire flow of opening the WebView and processing the response
   */
  public async authenticateWithWebView(
    options: WebViewOptions = {},
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const {
        url = `http://127.0.0.1:5500/form/form.html?origin=${window.location.origin}`,
        width = 800,
        height = 600,
        onSuccess,
        onError,
        onClose,
      } = options;

      // Open the WebView with our enhanced request handler
      const isOpened = this.webViewManager.openWebView({
        url,
        width,
        height,
        onClose: () => {
          if (onClose) onClose();
          // If the WebView is closed without a successful authentication, reject the promise
          if (this.webViewManager.isWebViewOpen()) {
            reject(new Error('Authentication canceled'));
          }
        },
      });

      if (!isOpened) {
        const error = new Error(
          'Failed to open WebView. Please check if popups are blocked.',
        );
        if (onError) onError(error);
        reject(error);
        return;
      }

      // Add a message listener to capture and log all messages
      const messageListener = (event: MessageEvent) => {
        if (this.webViewManager['allowedOrigins'].includes(event.origin)) {
          console.log('Raw WebView Message:', event.data);

          // Format in the requested structure
          console.log('WebView Event Structure:', {
            eventName: 'requestChannel',
            eventData:
              typeof event.data === 'string'
                ? event.data
                : JSON.stringify(event.data),
          });

          if (event.data.data.type === "request_otp") {
            this.webViewManager.sendResponse(
              'uuid-for-webview',
              'okto_sdk_login',
              {
                provider: 'whatsapp',
                whatsapp_number: event.data.data.whatsapp_number,
                token: 'bsdbcgsdjhgfjhsd',
              },
            );
          }

          // Try to parse if it's a string
          // if (typeof event.data === 'string') {
          //   try {
          //     const parsedData = JSON.parse(event.data);
          //     console.log('Parsed Event Data:', parsedData);
          //   } catch (e) {
          //     // Not valid JSON, ignore
          //   }
          // }
        }
      };

      // Add the message listener
      window.addEventListener('message', messageListener);

      // Send authentication request to WebView
      this.webViewManager
        .sendRequest('okto_sdk_login', {
          provider: 'okto',
          // Add any additional parameters needed
        })
        .then(async (response) => {
          // Remove the message listener
          window.removeEventListener('message', messageListener);

          console.log('WebView response:', response);
          // Process successful response
          if (response.status === 'success' && response.userToken) {
            try {
              // Use the token to authenticate with Okto core
              const user = await this.loginUsingOAuth(
                {
                  authToken: response.token!,
                  provider: 'okto',
                },
                (session) => {
                  // Store session
                  setLocalStorage('okto_session', JSON.stringify(session));
                  this.setSessionConfig(session);
                },
              );

              if (onSuccess) onSuccess(user);
              resolve(user);
            } catch (error) {
              if (onError) onError(error as Error);
              reject(error);
            }
          } else {
            const error = new Error(
              response.message || 'Authentication failed',
            );
            if (onError) onError(error);
            reject(error);
          }
        })
        .catch((error) => {
          // Remove the message listener
          window.removeEventListener('message', messageListener);

          if (onError) onError(error);
          reject(error);
        });
    });
  }

  /**
   * Close the WebView if it's open
   */
  public closeWebView(): void {
    this.webViewManager.closeWebView();
  }

  /**
   * Override loginUsingOAuth to handle session storage
   */
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

  /**
   * Override sessionClear to handle clean up
   */
  override sessionClear(): void {
    clearLocalStorage('okto_session');
    return super.sessionClear();
  }

  /**
   * Clean up resources when the client is destroyed
   */
  public destroy(): void {
    this.webViewManager.destroy();
  }
}

export { OktoClient };
export type { OktoClientConfig };
