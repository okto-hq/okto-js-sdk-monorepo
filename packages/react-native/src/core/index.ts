// src/core/OktoClient.ts
import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import  WebViewManager  from 'src/utils/webViewManager.js';

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

  override sessionClear(): void {
    clearStorage('okto_session');
    return super.sessionClear();
  }

  // 🔥 NEW METHOD: OAuth login via WebView
  loginWithWebView({
    providerTypes,
    apiKey,
    environment = 'sandbox',
    callbackUrl,
  }: {
    providerTypes: string[];
    apiKey: string;
    environment?: string;
    callbackUrl?: string;
  }): Promise<SessionConfig> {
    return new Promise((resolve, reject) => {
      const messageId = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const authUrl = WebViewManager.buildAuthUrl({
        messageId,
        providerTypes,
        apiKey,
        environment,
        callbackUrl,
      });

      WebViewManager.launchAuthFlow({
        authUrl,
        messageId,
        onSuccess: async (authData: AuthData) => {
          try {
            const result = await this.loginUsingOAuth(authData);
            // if ('address' in result) {
            //   resolve(this.getSessionConfig()!);
            // } else {
            //   reject(result); // RpcError
            // }
          } catch (error) {
            reject(error);
          }
        },
        onError: (error) => {
          reject(error);
        },
        onCancel: () => {
          reject(new Error('User cancelled authentication.'));
        },
      });
    });
  }
}

export { OktoClient };
export type { OktoClientConfig };
