// src/core/OktoClient.ts
import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
// import webViewManager from 'src/webview/webViewManager.js';
// import { navigate } from '../core/navigation.js';

class OktoClient extends OktoCoreClient {
  private readonly config: OktoClientConfig;
  constructor(config: OktoClientConfig) {
    super(config);
    this.config = config;
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

  openWebView = (url: string, navigation: any): void => {
    navigation.navigate('WebViewScreen', { 
      url,
      clientConfig: this.config,
    });

    console.log('Navigating to WebViewScreen with:', {
      url,
      clientConfig: this.config,
    });
  };

  override sessionClear(): void {
    clearStorage('okto_session');
    return super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };
