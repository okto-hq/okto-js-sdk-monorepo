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

  private handleDeepLink(url: string | null): void {
    if (!url || !url.startsWith('oktosdk://auth') || !this.authPromiseResolver)
      return;

    try {
      const urlObj = new URL(url);
      const idToken = urlObj.searchParams.get('id_token');
      const error = urlObj.searchParams.get('error');

      if (error) {
        this.authPromiseResolver.reject(
          new Error(`Authentication failed: ${error}`),
        );
        return;
      }

      if (idToken) {
        this.authPromiseResolver.resolve(idToken);
      } else {
        this.authPromiseResolver.reject(
          new Error('No id_token found in redirect URL'),
        );
      }
    } catch (error) {
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
    provider: 'google'
  ): Promise<Address | RpcError | undefined> {
    const redirectUrl = 'oktosdk://auth';
    const state = {
      redirect_uri: redirectUrl,
      platform: Platform.OS,
    };
  
    return super.loginUsingSocial(
      provider,
      state,
      async (url: string) => {
        console.log('Opening auth URL:', url);
        
        return new Promise<string>((resolve, reject) => {
          // Token extraction logic
          let idToken: string | null = null;
          
          // Store the start time for timeout checking
          const authStartTime = Date.now();
          
          // Function to extract ID token from URL
          const extractIdToken = (url: string): string | null => {
            try {
              // The ID token is in the URL after the # symbol
              const hashPart = url.split('#')[1] || '';
              const params = new URLSearchParams(hashPart);
              return params.get('id_token');
            } catch (error) {
              console.error('Error extracting ID token:', error);
              return null;
            }
          };
          
          // Setup listener for URL changes using Linking API
          const urlChangeListener = Linking.addEventListener('url', (event) => {
            const changedUrl = event.url;
            console.log('URL changed:', changedUrl);
            
            // Check if this is the auth handler URL with the token
            if (changedUrl.includes('onboarding.oktostage.com/__/auth/handler')) {
              // Extract the token from the URL
              const extractedToken = extractIdToken(changedUrl);
              if (extractedToken) {
                console.log('Found ID token in URL');
                idToken = extractedToken;
                
                // We don't resolve here - we wait for the deep link to complete the flow
                // This ensures the browser is properly closed before continuing
              }
            }
          });
          
          // Setup listener for deep link (when app reopens)
          const linkingSubscription = Linking.addEventListener('url', (event) => {
            console.log('Deep link received:', event.url);
            
            if (event.url && event.url.startsWith('oktosdk://auth')) {
              // Clean up listeners
              linkingSubscription.remove();
              urlChangeListener.remove();
              clearInterval(checkInterval);
              
              // If we have an ID token from the URL change, use it
              if (idToken) {
                console.log('Resolving with captured ID token');
                resolve(idToken);
              } else {
                // Fallback: try to extract from the deep link URL itself
                // (though you mentioned this won't contain the token)
                try {
                  const deepLinkToken = extractIdToken(event.url);
                  if (deepLinkToken) {
                    console.log('Resolving with token from deep link');
                    resolve(deepLinkToken);
                  } else {
                    reject(new Error('No ID token found in authentication response'));
                  }
                } catch (error) {
                  reject(new Error('Failed to extract token from authentication response'));
                }
              }
            }
          });
          
          // Open the auth URL in WebBrowser
          WebBrowser.openAuthSessionAsync(url, redirectUrl, {
            showInRecents: true,
            createTask: false,
            preferEphemeralSession: true,
          })
          .then((result) => {
            console.log('WebBrowser session ended with result:', result.type);
            
            if (result.type === 'dismiss') {
              // User closed the browser without completing auth
              linkingSubscription.remove();
              urlChangeListener.remove();
              clearInterval(checkInterval);
              reject(new Error('Authentication window closed'));
            }
          })
          .catch((error) => {
            console.error('Error in WebBrowser session:', error);
            linkingSubscription.remove();
            urlChangeListener.remove();
            clearInterval(checkInterval);
            reject(error);
          });
          
          // Set a timeout check
          const checkInterval = setInterval(() => {
            if (Date.now() - authStartTime > 300000) { // 5 minute timeout
              console.log('Authentication timed out');
              linkingSubscription.remove();
              urlChangeListener.remove();
              clearInterval(checkInterval);
              reject(new Error('Authentication timed out'));
            }
          }, 1000);
        });
      }
    );
  }

  private createExpoBrowserHandler(
    redirectUrl: string,
  ): (url: string) => Promise<string> {
    return async (authUrl: string) => {
      console.log('KARAN :: Opening auth URL:', authUrl);
      console.log('KARAN :: Redirect URL:', redirectUrl);
      console.log('KARAN :: Platform:', Platform.OS);
      console.log('KARAN :: Expo WebBrowser:', WebBrowser);
      console.log('KARAN :: Linking:', Linking);
      console.log('KAALinking URL:', Linking.getInitialURL);
      console.log('Linking addListener:', Linking.addListener);
      if (this.authPromiseResolver) {
        console.warn(
          'Existing auth session detected, clearing previous session',
        );
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
            this.authPromiseResolver.reject(
              new Error('Authentication timed out'),
            );
            this.authPromiseResolver = null;
            // try {
            //   WebBrowser.dismissAuthSession();
            // } catch (error) {
            //   console.error('Error dismissing auth session on timeout:', error);
            // }
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

            // Only handle dismissal if we still have an active promise resolver
            if (this.authPromiseResolver && result.type === 'dismiss') {
              this.authPromiseResolver.reject(
                new Error('User canceled authentication'),
              );
              this.authPromiseResolver = null;
            }
          })
          .catch((error) => {
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
    clearStorage('okto_session');
    super.sessionClear();

    // Clear any active authentication
    if (this.authPromiseResolver) {
      this.authPromiseResolver = null;
    }

    // // Close any open browser sessions
    // try {
    //   WebBrowser.dismissAuthSession();
    // } catch (error) {
    //   console.error('Error dismissing auth session during clear:', error);
    // }
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
