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

import { WebViewManager } from '../webview/webViewManager.js';
import type { WebViewOptions } from 'src/webview/types.js';
import { OktoAuthWebView } from 'src/webview/auth/authWebView.js';
import { AuthRequestHandler } from 'src/webview/auth/authRequestHandler.js';

class OktoClient extends OktoCoreClient {
  private webViewManager: WebViewManager | undefined;
  private authWebView: OktoAuthWebView | undefined;

  constructor(config: OktoClientConfig) {
    super(config);
    this.initializeSession();
    this.initializeWebView(); // Boolean: Debug mode optional parameter 
  }

  private async initializeSession(): Promise<void> {
    const session = await getLocalStorage('okto_session');
    if (session) {
      this.setSessionConfig(JSON.parse(session));
      this.syncUserKeys();
    }
  }

  private initializeWebView(debugMode?: boolean): void {
    this.webViewManager = new WebViewManager(debugMode);
    const authHandler = new AuthRequestHandler(this.webViewManager);
    this.authWebView = new OktoAuthWebView(this.webViewManager, authHandler);
  }

  public authenticateWithWebView(options: WebViewOptions = {}): Promise<any> {
    if (!this.authWebView) {
      throw new Error('AuthWebView is not initialized.');
    }
    return this.authWebView.open(options);
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
    this.webViewManager?.closeWebView();
  }

  public destroy(): void {
    this.webViewManager?.destroy();
  }
}

export { OktoClient };
export type { OktoClientConfig };
