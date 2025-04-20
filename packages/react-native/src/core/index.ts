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
    provider: 'google',
  ): Promise<Address | RpcError | undefined> {
    const redirectUrl = 'oktosdk://auth';
    const state = {
      redirect_uri: redirectUrl,
      platform: Platform.OS,
    };

    try {
      try {
        WebBrowser.dismissAuthSession();
      } catch (error) {
        console.error('Error dismissing previous auth session:', error);
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

  private createExpoBrowserHandler(
    redirectUrl: string,
  ): (url: string) => Promise<string> {
    return async (authUrl: string) => {
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
            try {
              WebBrowser.dismissAuthSession();
            } catch (error) {
              console.error('Error dismissing auth session on timeout:', error);
            }
          }
        }, 300000); // 5 minute timeout

        // Open auth URL in the Expo WebBrowser
        WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
          showInRecents: true,
          createTask: false,
          preferEphemeralSession: true, // Corrected property name
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
