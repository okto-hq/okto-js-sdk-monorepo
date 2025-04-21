import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData, SocialAuthType } from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

class OktoClient extends OktoCoreClient {
  private readonly config: OktoClientConfig;
  private authPromiseResolver: {
    resolve: (value: string) => void;
    reject: (reason: Error) => void;
  } | null = null;

  constructor(config: OktoClientConfig) {
    super(config);
    this.config = config;
    this.initializeSession();
  }

  private initializeSession(): void {
    const session = getStorage('okto_session');
    if (session) {
      try {
        const parsedSession = JSON.parse(session);
        this.setSessionConfig(parsedSession);
        this.syncUserKeys();
      } catch (error) {
        clearStorage('okto_session');
      }
    } else {
      console.log('[OktoClient] No stored session found');
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

  override async loginUsingSocial(
    provider: SocialAuthType
  ): Promise<Address | RpcError | undefined> {
    const redirectUrl = 'oktosdk://auth';
    const state = {
      client_url: redirectUrl,
      platform: Platform.OS,
    };

    // Clean up any existing sessions
    try {
      WebBrowser.maybeCompleteAuthSession();
      await WebBrowser.warmUpAsync();
    } catch (error) {
      console.error('[OktoClient] Error preparing browser:', error);
    }

    try {
      return await super.loginUsingSocial(
        provider,
        state,
        this.createExpoBrowserHandler(redirectUrl),
      );
    } catch (error) {
      console.error('[OktoClient] Social login error:', error);
      throw error;
    }
  }

  private createExpoBrowserHandler(
    redirectUrl: string,
  ): (url: string) => Promise<string> {
    return async (authUrl: string) => {
      // Check if we already have an auth session in progress
      if (this.authPromiseResolver) {
        console.warn(
          'Existing auth session detected, clearing previous session',
        );
        this.authPromiseResolver.reject(
          new Error('Auth session replaced by new request'),
        );
        this.authPromiseResolver = null;
      }

      // Create a new promise to handle the auth flow
      return new Promise<string>((resolve, reject) => {
        this.authPromiseResolver = { resolve, reject };

        // Set a timeout for auth flow
        const authTimeout = setTimeout(() => {
          if (this.authPromiseResolver) {
            this.authPromiseResolver.reject(
              new Error('Authentication timed out'),
            );
            this.authPromiseResolver = null;

            WebBrowser.coolDownAsync()
              .then(() =>
                console.log('[OktoClient] Browser cooled down after timeout'),
              )
              .catch((error) =>
                console.error(
                  '[OktoClient] Error cooling down browser:',
                  error,
                ),
              );
          }
        }, 300000); // 5 minute timeout

        // Open auth URL in the Expo WebBrowser
        WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
          showInRecents: true,
          createTask: false,
          preferEphemeralSession: true,
        })
          .then((result) => {
            clearTimeout(authTimeout);

            // The browser session ended, but we might have already processed the redirect
            // Check if we still have an active promise resolver
            if (this.authPromiseResolver) {
              if (result.type === 'success') {
                // If the URL contains an id_token, extract it (fallback mechanism)
                try {
                  if (result.url && result.url.includes('id_token=')) {
                    const urlObj = new URL(result.url);
                    const idToken = urlObj.searchParams.get('id_token');
                    if (idToken) {
                      this.authPromiseResolver.resolve(idToken);
                      this.authPromiseResolver = null;
                      return;
                    }
                  }
                } catch (error) {
                  console.error(
                    '[OktoClient] Error extracting token from success URL:',
                    error,
                  );
                }
              }
              if (result.type === 'dismiss') {
                if (this.authPromiseResolver) {
                  this.authPromiseResolver.reject(
                    new Error('User canceled authentication'),
                  );
                  this.authPromiseResolver = null;
                }
              }
            } else {
              console.log(
                '[OktoClient] No active promise resolver - auth may have completed via deep link',
              );
            }
          })
          .catch((error) => {
            console.error('[OktoClient] Browser session error:', error);
            clearTimeout(authTimeout);

            if (this.authPromiseResolver) {
              this.authPromiseResolver.reject(error);
              this.authPromiseResolver = null;
            }
          });
      });
    };
  }

  override sessionClear(): void {
    console.log('[OktoClient] Clearing session');
    clearStorage('okto_session');
    super.sessionClear();

    if (this.authPromiseResolver) {
      console.log('[OktoClient] Clearing active auth promise resolver');
      this.authPromiseResolver = null;
    }

    try {
      console.log('[OktoClient] Attempting to dismiss auth session');
      WebBrowser.dismissAuthSession();
    } catch (error) {
      console.error(
        '[OktoClient] Error dismissing auth session during clear:',
        error,
      );
    }
  }

  public openWebView(url: string, navigation: any): void {
    console.log('[OktoClient] Opening WebView with URL:', url);
    navigation.navigate('WebViewScreen', {
      url,
      clientConfig: this.config,
    });
  }
}

export { OktoClient };
export type { OktoClientConfig };
