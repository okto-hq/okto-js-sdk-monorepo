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
    console.log("karan is uhere in oktoclient");
  }

  private initializeSession(): void {
    const session = getStorage('okto_session');
    const sessionWhatsapp = getStorage('okto_session_whatsapp');
    if (session) {
      this.setSessionConfig(JSON.parse(session));
      console.log("karan is here in session");
      this.syncUserKeys();
    } else if (sessionWhatsapp) {
      this.setSessionConfig(JSON.parse(sessionWhatsapp));
      this.syncUserKeys();
      console.log("karan is here in session whatsapp");
    }
  }

  /**
   * Override of OAuth login to persist session in storage
   * @param data Authentication data
   * @param onSuccess Optional callback on successful authentication
   * @returns Promise resolving to user address or error
   */

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

  /**
   * Opens a WebView for authentication flows
   * @param url URL to open in WebView
   * @param navigation Navigation object to navigate to WebView screen
   */
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
    clearStorage('okto_session_whatsapp');
    return super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };