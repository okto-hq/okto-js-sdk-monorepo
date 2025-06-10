import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
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

import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import { AuthRequestHandler } from 'src/webview/auth/authRequestHandler.js';
import { OktoAuthWebView } from 'src/webview/auth/authWebView.js';
import type {
  AppearanceOptions,
  WebViewOptions,
  WebViewResponseOptions,
} from 'src/webview/types.js';
import { WebViewManager } from '../webview/webViewManager.js';

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

  private initializeWebView(
    debugMode?: boolean,
    options?: WebViewOptions,
  ): void {
    this.webViewManager = new WebViewManager(debugMode, options);
    const authHandler = new AuthRequestHandler(this.webViewManager, this);
    this.authWebView = new OktoAuthWebView(this.webViewManager, authHandler);
  }

  /**
   * Opens the authentication page in a webview and handles the response.
   * @param options - Options for customizing the webview behavior -- onSuccess, onError and onClose.
   * @param style - Optional appearance styles for the webview.
   * @returns A promise that resolves to the authentication response or an error message.
   * 
   * @description
   * @argument {AppearanceOptions} style - Optional appearance styles for the webview.
   *
   * @AppearanceOptions
   * @description Interface for configuring the appearance of the application.
   * @property {string} [version] - Version of the appearance configuration.
   * @property {AppearanceTheme} [appearance] - Theme configuration.
   * @property {VendorInfo} [vendor] - Vendor information.
   * @property {LoginOptions} [loginOptions] - Login options configuration.
   *
   * @AppearanceTheme
   * @description Interface for theme configuration.
   * @property {"dark" | "light"} [themeName] - Pre-defined theme names.
   * @property {Record<string, string>} [theme] - Custom theme variables.
   * 
   * @VendorInfo
   * @description Interface for vendor information.
   * @property {string} name - Name of the vendor.
   * @property {string} logo - URL of the vendor logo.

   * @LoginOptions
   * @description Interface for login options configuration.
   * @property {SocialLogin[]} [socialLogins] - List of social login options.
   * @property {OtpLoginOption[]} [otpLoginOptions] - List of OTP login options.
   * @property {ExternalWallet[]} [externalWallets] - List of external wallet options.

   * @SocialLogin
   * @description Interface for social login options.
   * @property {string} [type] - Type of social login (e.g., "google", "steam", "twitter").
   * @property {number} [position] - Position of the social login in the list.

   * @OtpLoginOption
   * @description Interface for OTP login options.
   * @property {string} [type] - Type of OTP login (e.g., "email", "phone").
   * @property {number} [position] - Position of the OTP login in the list.

   * @ExternalWallet
   * @description Interface for external wallet options.
   * @property {string} [type] - Type of external wallet (e.g., "metamask", "walletconnect").
   * @property {number} [position] - Position of the external wallet in the list.
   * @property {Record<string, unknown>} [metadata] - Additional metadata for the wallet.

   * @ThemeVariables
   * @description Interface for theme variables.
   * @property {string} [--okto-body-background] - Background for the whole page.
   * @property {string} [--okto-body-color-tertiary] - Placeholder text color.
   * @property {string} [--okto-accent-color] - Accent color for buttons, etc.
   * @property {string | number} [--okto-button-font-weight] - Font weight for buttons.
   * @property {string} [--okto-border-color] - Border color for inputs.
   * @property {string} [--okto-stroke-divider] - Divider color.
   * @property {string} [--okto-font-family] - Font family for the application.
   * @property {string} [--okto-rounded-sm] - Small border radius.
   * @property {string} [--okto-rounded-md] - Medium border radius.
   * @property {string} [--okto-rounded-lg] - Large border radius.
   * @property {string} [--okto-rounded-xl] - Extra large border radius.
   * @property {string} [--okto-rounded-full] - Full border radius.
   * @property {string} [--okto-success-color] - Success color for alerts.
   * @property {string} [--okto-warning-color] - Warning color for alerts.
   * @property {string} [--okto-error-color] - Error color for alerts.
   * @property {string} [--okto-text-primary] - Primary color for texts.
   * @property {string} [--okto-text-secondary] - Secondary color for texts (e.g., subtitles).
   * @property {string} [--okto-background-surface] - Background color for card headers in desktop view.
   * @property {string | number | undefined} [key: string] - Additional custom theme variables.
   */
  public authenticateWithWebView(
    options: WebViewResponseOptions = {},
    style?: AppearanceOptions,
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
    return this.authWebView.open(
      {
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
      },
      style,
    );
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

  override sessionClear(): void {
    clearLocalStorage('okto_session');
    return super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };
