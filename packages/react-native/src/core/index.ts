import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import { Platform, Linking } from 'react-native';
import type { EmitterSubscription } from 'react-native';
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
    console.log('[OktoClient] Initializing session from storage');
    const session = getStorage('okto_session');
    if (session) {
      try {
        console.log('[OktoClient] Found stored session, restoring');
        const parsedSession = JSON.parse(session);
        this.setSessionConfig(parsedSession);
        this.syncUserKeys();
        console.log('[OktoClient] Session restored successfully');
      } catch (error) {
        console.error('[OktoClient] Error initializing session:', error);
        console.log('[OktoClient] Clearing invalid session data');
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
    console.log('[OktoClient] Logging in using OAuth');
    return super.loginUsingOAuth(data, (session) => {
      console.log('[OktoClient] OAuth login successful, storing session');
      setStorage('okto_session', JSON.stringify(session));
      this.setSessionConfig(session);
      onSuccess?.(session);
    });
  }

  override async loginUsingSocial(
    provider: 'google',
  ): Promise<Address | RpcError | undefined> {
    console.log(
      `[OktoClient] Starting social login with provider: ${provider}`,
    );
    const redirectUrl = 'oktosdk://auth';
    const state = {
      client_url: redirectUrl,
      platform: Platform.OS,
    };

    console.log('[OktoClient] Redirect URL:', redirectUrl);
    console.log('[OktoClient] State:', JSON.stringify(state));

    // Clean up any existing sessions
    try {
      console.log(
        '[OktoClient] Attempting to complete any existing auth sessions',
      );
      WebBrowser.maybeCompleteAuthSession();
      console.log('[OktoClient] Warming up browser');
      await WebBrowser.warmUpAsync();
    } catch (error) {
      console.error('[OktoClient] Error preparing browser:', error);
    }

    try {
      console.log(
        '[OktoClient] Calling super.loginUsingSocial with custom handler',
      );
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
      console.log('[OktoClient] Creating browser handler');
      console.log('[OktoClient] Auth URL:', authUrl);
      console.log('[OktoClient] Redirect URL:', redirectUrl);

      // Check if WebBrowser is available
      if (!WebBrowser) {
        console.error('[OktoClient] WebBrowser module is not available!');
        throw new Error('WebBrowser module is not available');
      }

      // Check if we can open the auth URL
      try {
        const canOpen = await Linking.canOpenURL(authUrl);
        console.log('[OktoClient] Can open auth URL:', canOpen);
        if (!canOpen) {
          console.warn(
            '[OktoClient] Cannot open auth URL, this may cause issues',
          );
        }
      } catch (error) {
        console.error(
          '[OktoClient] Error checking if can open auth URL:',
          error,
        );
      }

      // Check if we already have an auth session in progress
      if (this.authPromiseResolver) {
        console.warn(
          '[OktoClient] Existing auth session detected, clearing previous session',
        );
        this.authPromiseResolver.reject(
          new Error('Auth session replaced by new request'),
        );
        this.authPromiseResolver = null;
      }

      // Create a new promise to handle the auth flow
      return new Promise<string>((resolve, reject) => {
        console.log('[OktoClient] Setting up auth promise resolver');
        this.authPromiseResolver = { resolve, reject };

        // Set a timeout for auth flow
        const authTimeout = setTimeout(() => {
          console.error(
            '[OktoClient] Authentication timed out after 5 minutes',
          );
          if (this.authPromiseResolver) {
            this.authPromiseResolver.reject(
              new Error('Authentication timed out'),
            );
            this.authPromiseResolver = null;

            // Cool down the browser
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

        console.log('[OktoClient] Opening auth session in browser');

        // Open auth URL in the Expo WebBrowser
        WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
          showInRecents: true,
          createTask: false,
          preferEphemeralSession: true,
        })
          .then((result) => {
            console.log(
              '[OktoClient] Browser session result:',
              JSON.stringify(result),
            );
            clearTimeout(authTimeout);

            // The browser session ended, but we might have already processed the redirect
            // Check if we still have an active promise resolver
            if (this.authPromiseResolver) {
              if (result.type === 'success') {
                console.log(
                  '[OktoClient] Browser reports success, but no deep link handling occurred',
                );
                // If the URL contains an id_token, extract it (fallback mechanism)
                try {
                  if (result.url && result.url.includes('id_token=')) {
                    const urlObj = new URL(result.url);
                    const idToken = urlObj.searchParams.get('id_token');
                    if (idToken) {
                      console.log(
                        '[OktoClient] Extracted id_token from success URL',
                      );
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
                console.log(
                  '[OktoClient] User dismissed the browser without completing auth',
                );
                // this.authPromiseResolver.reject(
                //   new Error('User canceled authentication'),
                // );
                this.authPromiseResolver = null;
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

    // Clear any active authentication
    if (this.authPromiseResolver) {
      console.log('[OktoClient] Clearing active auth promise resolver');
      this.authPromiseResolver = null;
    }

    // Close any open browser sessions
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
      onAuthSuccess: (session: SessionConfig) => {
        console.log('[OktoClient] WebView auth successful');
        setStorage('okto_session', JSON.stringify(session));
        this.setSessionConfig(session);
      },
      onAuthFailure: (error: Error) => {
        console.error('[OktoClient] WebView authentication failed:', error);
      },
    });
  }
}

export { OktoClient };
export type { OktoClientConfig };
