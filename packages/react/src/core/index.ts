import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type {
  Address,
  AuthData,
  OnrampOptions,
  SocialAuthType,
} from '@okto_web3/core-js-sdk/types';

import {
  clearLocalStorage,
  getLocalStorage,
  setLocalStorage,
} from 'src/utils/storageUtils.js';

import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import { AuthRequestHandler } from 'src/webview/auth/authRequestHandler.js';
import { OktoAuthWebView } from 'src/webview/auth/authWebView.js';
import type {
  WebViewOptions,
  WebViewResponseOptions,
} from 'src/webview/types.js';
import { WebViewManager } from '../webview/webViewManager.js';
import { OktoOnrampWebView } from '../webview/onramp/onrampWebView.js';
import { OnrampRequestHandler } from '../webview/onramp/onrampRequestHandler.js';

class OktoClient extends OktoCoreClient {
  private webViewManager: WebViewManager | undefined;
  private authWebView: OktoAuthWebView | undefined;
  private oktoOnrampWebView: OktoOnrampWebView | undefined;

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

  private initializeWebView(
    debugMode?: boolean,
    options?: WebViewOptions,
  ): void {
    this.webViewManager = new WebViewManager(debugMode, options);
    const authHandler = new AuthRequestHandler(this.webViewManager, this);
    this.authWebView = new OktoAuthWebView(this.webViewManager, authHandler);
    const onrampRequestHandler = new OnrampRequestHandler(
      this.webViewManager,
      this,
    );
    this.oktoOnrampWebView = new OktoOnrampWebView(
      this.webViewManager,
      onrampRequestHandler,
    );
  }

  public authenticateWithWebView(
    options: WebViewResponseOptions = {},
  ): Promise<string | { message: string }> {
    if (!this.authWebView) {
      throw new Error('AuthWebView is not initialized.');
    } else {
      this.webViewManager?.setOnCloseCallback(options.onClose ?? (() => {}));
      this.webViewManager?.setOnErrorCallback(options.onError ?? (() => {}));
      this.webViewManager?.setOnSuccessCallback(
        options.onSuccess ?? (() => {}),
      );
    }
    const authUrl = this.getAuthPageUrl();
    return this.authWebView.open({
      url: authUrl,
      onSuccess(data) {
        options.onSuccess?.(data);
      },
      onClose() {
        options.onClose?.();
      },
      onError(error) {
        options.onError?.(error);
      },
    });
  }

  private getAuthPageUrl(): string {
    const { env } = this;
    if (!env.authPageUrl) {
      throw new Error(
        '[OktoClient] Authentication page URL is not configured for this environment',
      );
    }
    return env.authPageUrl;
  }

  /**
   * Overrides the `loginUsingOAuth` method to handle OAuth login functionality.
   * Stores the session configuration in local storage and updates the session state.
   *
   * @param data - The authentication data required for OAuth login.
   * @param onSuccess - Optional callback function to execute upon successful login.
   *                     Receives the session configuration as a parameter.
   * @returns A promise that resolves to an `Address`, `RpcError`, or `undefined`.
   *
   * @deprecated This method is deprecated and may be removed in future versions.
   *             Consider using the updated authentication methods provided by the SDK.
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

  override loginUsingSocial(
    provider: SocialAuthType,
  ): Promise<Address | RpcError | undefined> {
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
      },
    );
  }

  override loginUsingEmail(
    email: string,
    otp: string,
    token: string,
    onSuccess?: (session: SessionConfig) => void,
    overrideSessionConfig?: SessionConfig | undefined,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingEmail(
      email,
      otp,
      token,
      (session) => {
        setLocalStorage('okto_session', JSON.stringify(session));
        this.setSessionConfig(session);
        onSuccess?.(session);
      },
      overrideSessionConfig,
    );
  }

  override sessionClear(): void {
    clearLocalStorage('okto_session');
    return super.sessionClear();
  }

  public async openOnrampWebView(tokenId: string, options?: OnrampOptions) {
    if (!this.webViewManager) {
      throw new Error('WebViewManager is not initialized.');
    }
    const onrampUrl = await this.generateOnrampUrl(tokenId, options);
    return this.oktoOnrampWebView?.open({
      url: onrampUrl,
      onSuccess: (data) => {
        console.log('Onramp WebView closed successfully:', data);
      },
      onClose: () => {
        console.log('Onramp WebView closed by user.');
      },
      onError: (error) => {
        console.error('Error in Onramp WebView:', error);
      },
    });
  }
}

export { OktoClient };
export type { OktoClientConfig };
