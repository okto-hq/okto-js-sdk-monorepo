// src/core/OktoClient.ts
import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import WebViewManager from '../webview/webViewManager.js';
import {
  type WebViewConfig,
  ProviderType,
  WebViewMethodType,
  MessageStatus,
} from '../types/webview.js';

class OktoClient extends OktoCoreClient {
  constructor(config: OktoClientConfig) {
    super(config);
    this.initializeSession();
  }

  private initializeSession(): void {
    const session = getStorage('okto_session');
    if (session) {
      this.setSessionConfig(JSON.parse(session));
      this.syncUserKeys();
    }
  }

  override loginUsingOAuth(
    data: AuthData,
    onSuccess?: (session: SessionConfig) => void,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data, (session) => {
      setStorage('okto_session', JSON.stringify(session));
      this.setSessionConfig(session);
      onSuccess?.(session);
    });
  }

  // openWebViewScreen(navigation: any): void {
  //   navigation.navigate('OktoWebView', {
  //     url: "https://www.google.com/",});
  // }

  override sessionClear(): void {
    clearStorage('okto_session');
    return super.sessionClear();
  }

  launchAuthWebView = async (
    provider: ProviderType,
    config?: Partial<WebViewConfig>,
  ): Promise<any> => {
    try {
      const webViewUrl = 'https://onboarding.oktostage.com/';

      // Launch the WebView
      await WebViewManager.launchWebView({
        url: webViewUrl,
        headers: config?.headers || {},
        onClose: config?.onClose,
      });

      // Return a promise that resolves when auth is complete
      return new Promise((resolve, reject) => {
        WebViewManager.sendRequest(
          {
            method: WebViewMethodType.LOGIN,
            data: {
              provider: provider,
            },
          },
          (response) => {
            if (response.data.status === MessageStatus.SUCCESS) {
              resolve(response.data);
            } else if (response.data.status === MessageStatus.ERROR) {
              reject(
                new Error(response.data.message || 'Authentication failed'),
              );
            }
          },
        );
      });
    } catch (error) {
      throw error;
    }
  };
}

export { OktoClient };
export type { OktoClientConfig };
