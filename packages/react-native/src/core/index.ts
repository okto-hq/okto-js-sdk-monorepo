// src/core/OktoClient.ts

import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';

import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';

class OktoClient extends OktoCoreClient {
  private readonly config: OktoClientConfig;

  constructor(config: OktoClientConfig) {
    super(config);
    this.config = config;
    this.restoreSession();
  }

  private restoreSession(): void {
    const savedSession =
      getStorage('okto_session') ?? getStorage('okto_session_whatsapp');

    if (savedSession) {
      try {
        const session: SessionConfig = JSON.parse(savedSession);
        this.setSessionConfig(session);
        this.syncUserKeys();
      } catch (error) {
        console.error('Failed to parse saved session:', error);
      }
    }
  }

  /**
   * Persists session and sets up the SDK session configuration.
   * @param data Authentication data from OAuth
   * @param onSuccess Optional callback with the session object
   */
  override async loginUsingOAuth(
    data: AuthData,
    onSuccess?: (session: SessionConfig) => void,
  ): Promise<Address | RpcError | undefined> {
    try {
      const result = await super.loginUsingOAuth(data, (session) => {
        setStorage('okto_session', JSON.stringify(session));
        this.setSessionConfig(session);
        onSuccess?.(session);
      });
      return result;
    } catch (error) {
      console.error('OAuth login failed:', error);
      return error as RpcError;
    }
  }

  /**
   * Opens a WebView for authentication flows using navigation object.
   * @param url URL to be loaded in WebView
   * @param navigation React Navigation object
   */
  openWebView(url: string, navigation: any): void {
    if (!url || !navigation) {
      console.warn('Missing URL or navigation object for openWebView');
      return;
    }

    navigation.navigate('WebViewScreen', {
      url,
      clientConfig: this.config,
    });

    console.debug('Navigated to WebViewScreen with:', {
      url,
      clientConfig: this.config,
    });
  }

  /**
   * Clears session from storage and SDK.
   */
  override sessionClear(): void {
    clearStorage('okto_session');
    clearStorage('okto_session_whatsapp');
    super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };
