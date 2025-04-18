import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type {
  Address,
  AuthData,
  SocialAuthType,
} from '@okto_web3/core-js-sdk/types';

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
    this.initializeWebView(true); // Boolean: Debug mode optional parameter
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
    const authHandler = new AuthRequestHandler(this.webViewManager, this);
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

  override loginUsingSocial(provider: SocialAuthType): Promise<Address | RpcError | undefined> {
    const client_url = window.location.origin;
    
    return super.loginUsingSocial(
      provider,
      {
        client_url: client_url,
        platform: 'web',
      },
      async (url: string) => {
        return new Promise((resolve, reject) => {
          const width = 500;
          const height = 600;
          const left = window.screenX + (window.innerWidth - width) / 2;
          const top = window.screenY + (window.innerHeight - height) / 2;
  
          const authWindow = window.open(
            url,
            '_blank',
            `width=${width},height=${height},top=${top},left=${left}`,
          );
  
          if (!authWindow) {
            reject(new Error('Failed to open authentication popup.'));
            return;
          }
  
          const interval = setInterval(() => {
            try {
              if (authWindow.closed) {
                clearInterval(interval);
                reject(new Error('Authentication popup closed.'));
              } else {
                const popupUrl = authWindow.location.href;
                if (popupUrl.startsWith(window.location.origin)) {
                  const url = new URL(popupUrl);
                  const idToken = url.searchParams.get('id_token');
                  if (idToken) {
                    clearInterval(interval);
                    authWindow.close();
                    resolve(idToken);
                  }
                }
              }
            } catch (error) {
              console.debug('Waiting for redirect...', error);
            }
          }, 500);
        });
      }
    );
  }

  override sessionClear(): void {
    clearLocalStorage('okto_session');
    return super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };
