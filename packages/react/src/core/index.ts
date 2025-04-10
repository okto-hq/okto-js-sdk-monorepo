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
import { createAuthRequestHandler } from 'src/webview/auth/requestHandler.js';
import { oktoAuthWebView } from 'src/webview/auth/authWebView.js';

class OktoClient extends OktoCoreClient {
  private webViewManager: WebViewManager;

  constructor(config: OktoClientConfig) {
    super(config);
    this.initializeSession();
    this.webViewManager = new WebViewManager(); // true: To enable Debug Mode for development
  }

  private async initializeSession(): Promise<void> {
    const session = await getLocalStorage('okto_session');
    if (session) {
      this.setSessionConfig(JSON.parse(session));
      this.syncUserKeys();
    }
  }

  public authenticateWithWebView(options: WebViewOptions = {}): Promise<any> {
    const requestHandler = createAuthRequestHandler(this.webViewManager);
    return oktoAuthWebView(this.webViewManager, requestHandler, options);
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
