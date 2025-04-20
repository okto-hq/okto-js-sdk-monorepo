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
  private deepLinkSubscription: EmitterSubscription | null = null;
  private authPromiseResolver: {
    resolve: (value: string) => void;
    reject: (reason: Error) => void;
  } | null = null;

  constructor(config: OktoClientConfig) {
    super(config);
    this.config = config;
    this.initializeSession();
    this.initializeDeepLinkHandlers();
  }

  private initializeSession(): void {
    const session = getStorage('okto_session');
    if (session) {
      try {
        const parsedSession = JSON.parse(session);
        this.setSessionConfig(parsedSession);
        this.syncUserKeys();
      } catch (error) {
        console.error('Error initializing session:', error);
        clearStorage('okto_session');
      }
    }
  }

  private initializeDeepLinkHandlers(): void {
    Linking.getInitialURL()
      .then((url) => {
        if (url) this.handleDeepLink(url);
      })
      .catch((error) => console.error('Error getting initial URL', error));

    this.deepLinkSubscription = Linking.addListener('url', (event) => {
      this.handleDeepLink(event.url);
    });
  }

  // Improved URL handling to extract parameters from both query and fragment parts
  private parseUrlParams(url: string): Record<string, string> {
    const params: Record<string, string> = {};
    try {
      // Create URL object from the input URL
      const urlObj = new URL(url);
      
      // Extract search params (after '?')
      const searchParams = new URLSearchParams(urlObj.search);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      // Extract hash params (after '#') if any
      if (urlObj.hash && urlObj.hash.length > 1) {
        // Remove the '#' character and parse as search params
        const hashParams = new URLSearchParams(urlObj.hash.substring(1));
        hashParams.forEach((value, key) => {
          params[key] = value;
        });
      }
    } catch (error) {
      console.error('Error parsing URL parameters:', error);
    }
    return params;
  }

  private handleDeepLink(url: string | null): void {
    if (!url || !url.startsWith('oktosdk://auth') || !this.authPromiseResolver) {
      console.log('Invalid deep link or no auth resolver:', url);
      return;
    }

    try {
      console.log('Processing deep link:', url);
      
      // Parse parameters from both query and fragment parts of the URL
      const params = this.parseUrlParams(url);
      
      console.log('Extracted params:', params);
      const idToken = params['id_token'];
      const error = params['error'];

      if (error) {
        this.authPromiseResolver.reject(
          new Error(`Authentication failed: ${error}`),
        );
        return;
      }

      if (idToken) {
        console.log('Successfully extracted id_token');
        this.authPromiseResolver.resolve(idToken);
      } else {
        console.error('No id_token found in redirect URL');
        this.authPromiseResolver.reject(
          new Error('No id_token found in redirect URL'),
        );
      }
    } catch (error) {
      console.error('Failed to process authentication response:', error);
      this.authPromiseResolver.reject(
        new Error('Failed to process authentication response'),
      );
    } finally {
      this.authPromiseResolver = null;
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
    provider: 'google',
  ): Promise<Address | RpcError | undefined> {
    const redirectUrl = 'oktosdk://auth';
    const state = {
      redirect_uri: redirectUrl,
      platform: Platform.OS,
    };

    try {
      // Try to dismiss any existing auth sessions
      try {
        await WebBrowser.dismissAuthSession();
      } catch (error) {
        console.log('No existing auth session to dismiss');
      }

      return await super.loginUsingSocial(
        provider,
        state,
        this.createExpoBrowserHandler(redirectUrl),
      );
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
  }

  // Modified to handle redirection from Okto to the custom URL scheme
  private createExpoBrowserHandler(
    redirectUrl: string,
  ): (url: string) => Promise<string> {
    return async (authUrl: string) => {
      console.log('Opening auth URL:', authUrl);
      console.log('Redirect URL:', redirectUrl);
      
      if (this.authPromiseResolver) {
        console.warn('Existing auth session detected, clearing previous session');
        this.authPromiseResolver.reject(
          new Error('Auth session replaced by new request'),
        );
        this.authPromiseResolver = null;
      }

      return new Promise<string>((resolve, reject) => {
        // Store the promise resolver for use in the deep link handler
        this.authPromiseResolver = { resolve, reject };

        // Set a timeout for auth flow
        const authTimeout = setTimeout(() => {
          if (this.authPromiseResolver) {
            console.error('Authentication timed out');
            this.authPromiseResolver.reject(
              new Error('Authentication timed out'),
            );
            this.authPromiseResolver = null;
            
            try {
              WebBrowser.dismissAuthSession();
            } catch (error) {
              console.error('Error dismissing auth session on timeout:', error);
            }
          }
        }, 300000); // 5 minute timeout

        // Create a listener specifically for the redirect with token
        const tokenListener = (event: { url: string }) => {
          if (event.url.startsWith(redirectUrl)) {
            // Extract the URL from the handler URL
            const handlerUrl = new URL(event.url);
            
            if (handlerUrl.searchParams.has('id_token')) {
              const idToken = handlerUrl.searchParams.get('id_token');
              if (idToken && this.authPromiseResolver) {
                clearTimeout(authTimeout);
                this.authPromiseResolver.resolve(idToken);
                this.authPromiseResolver = null;
                subscription.remove();
                
                try {
                  WebBrowser.dismissAuthSession();
                } catch (error) {
                  console.error('Error dismissing auth session after success:', error);
                }
              }
            }
          }
        };

        // Add the temp listener and store the subscription
        const subscription = Linking.addEventListener('url', tokenListener as any);

        // Open auth URL in the Expo WebBrowser
        WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
          showInRecents: true,
          createTask: false,
          preferEphemeralSession: true,
        })
          .then((result) => {
            clearTimeout(authTimeout);
            subscription.remove();

            // Only handle dismissal if we still have an active promise resolver
            if (this.authPromiseResolver) {
              if (result.type === 'success') {
                // For URLs with fragment identifiers, WebBrowser might not correctly redirect
                // so we need to extract the token from the success URL if possible
                try {
                  const resultUrl = result.url;
                  if (resultUrl) {
                    // This url might contain the tokens in the fragment
                    const params = this.parseUrlParams(resultUrl);
                    const idToken = params['id_token'];
                    
                    if (idToken) {
                      this.authPromiseResolver.resolve(idToken);
                      this.authPromiseResolver = null;
                      return;
                    }
                  }
                } catch (e) {
                  console.error('Error extracting token from success URL:', e);
                }
              }

              if (result.type === 'dismiss') {
                // this.authPromiseResolver.reject(
                //   new Error('User canceled authentication'),
                // );
                this.authPromiseResolver = null;
              }
            }
          })
          .catch((error) => {
            clearTimeout(authTimeout);
            subscription.remove();

            if (this.authPromiseResolver) {
              this.authPromiseResolver.reject(error);
              this.authPromiseResolver = null;
            }
          });
      });
    };
  }

  override sessionClear(): void {
    clearStorage('okto_session');
    super.sessionClear();

    // Clear any active authentication
    if (this.authPromiseResolver) {
      this.authPromiseResolver = null;
    }

    // Close any open browser sessions
    try {
      WebBrowser.dismissAuthSession();
    } catch (error) {
      console.error('Error dismissing auth session during clear:', error);
    }
  }

  public destroy(): void {
    if (this.deepLinkSubscription) {
      this.deepLinkSubscription.remove();
      this.deepLinkSubscription = null;
    }

    this.sessionClear();
  }

  public openWebView(url: string, navigation: any): void {
    navigation.navigate('WebViewScreen', {
      url,
      clientConfig: this.config,
      onAuthSuccess: (session: SessionConfig) => {
        setStorage('okto_session', JSON.stringify(session));
        this.setSessionConfig(session);
      },
      onAuthFailure: (error: Error) => {
        console.error('WebView authentication failed:', error);
      },
    });
  }
}

export { OktoClient };
export type { OktoClientConfig };