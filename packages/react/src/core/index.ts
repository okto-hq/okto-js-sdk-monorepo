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

  public loginUsingGoogleAuth(): void {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      scope: 'openid email profile',
      redirect_uri: 'https://onboarding.oktostage.com/__/auth/handler', // 'http://localhost:5000/__/auth/handler'
      response_type: 'id_token',
      client_id:
        '54780876714-t59u4t7r1pekdj3p54grd9nh4rfg8qvd.apps.googleusercontent.com',
      nonce: 'b703d535-bc46-4911-8aa3-25fb6c19e2ce',
      state: JSON.stringify({
        client_url: window.location.origin,
        platform: 'web',
      }),
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log('Opening Google Auth URL:', url);

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
      throw new Error('Failed to open authentication popup.');
    }

    const interval = setInterval(() => {
      try {
        if (authWindow.closed) {
          clearInterval(interval);
          console.log('Authentication popup closed.');
        } else {
          const popupUrl = authWindow.location.href;
          if (popupUrl.startsWith(window.location.origin)) {
            const url = new URL(popupUrl);
            console.log('Popup URL:', url.href);
            const idToken = url.searchParams.get('id_token');
            const stateParam = url.searchParams.get('state');
            if (idToken) {
              console.log('ID Token received:', idToken);
              setLocalStorage('auth_token', idToken);
              this.loginUsingOAuth(
                { idToken: idToken, provider: 'google' },
                (session) => {
                  console.log('Login successful:', session);
                  this.setSessionConfig(session);
                },
              );
            } else if (stateParam) {
              try {
                const stateParams = JSON.parse(stateParam);
                console.log('Parsed State:', stateParams);
              } catch (error) {
                console.error('Failed to parse state parameter:', error);
              }
            } else {
              console.warn('No id_token or state parameter found in the URL');
            }

            authWindow.close();
            clearInterval(interval);
          }
        }
      } catch (error) {
        // Ignore cross-origin errors until the popup redirects to the same origin
        console.debug('Waiting for redirect...', error);
      }
    }, 500);
  }

  override sessionClear(): void {
    clearLocalStorage('okto_session');
    return super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };
