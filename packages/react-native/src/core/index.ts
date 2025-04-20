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
        console.log('KARAN :: Initial URL:', url);
        if (url) this.handleDeepLink(url);
      })
      .catch((error) => console.error('Error getting initial URL', error));

    this.deepLinkSubscription = Linking.addListener('url', (event) => {
      console.log('Deep link event received:', event.url);
      this.handleDeepLink(event.url);
    });
  }

  private handleDeepLink(url: string | null): void {
    console.log('Handling deep link:', url);
    
    if (!url || !url.startsWith('oktosdk://auth')) {
      console.log('Not an auth deep link or no URL');
      return;
    }
    
    if (!this.authPromiseResolver) {
      console.log('No active auth promise resolver');
      return;
    }

    try {
      // First check URL parameters (after ?)
      const urlParts = url.split('?');
      const params = new URLSearchParams(urlParts[1] || '');
      let idToken = params.get('id_token');
      console.log('KARAN :: ID token found in URL params:', idToken);
      let error = params.get('error');

      // If not found, check for URL fragment (after #)
      if (!idToken && url.includes('#')) {
        const fragmentParts = url.split('#')[1] || '';
        const fragmentParams = new URLSearchParams(fragmentParts);
        idToken = fragmentParams.get('id_token');
        console.log(' KARAN :: ID token found in fragment:', idToken);
        error = fragmentParams.get('error');
      }

      // If still not found, check if this is a state param with id_token inside
      if (!idToken) {
        const stateParam = params.get('state');
        if (stateParam) {
          try {
            const state = JSON.parse(decodeURIComponent(stateParam));
            if (state && state.id_token) {
              idToken = state.id_token;
              console.log(' KARAN :: ID token found in state parameter:', idToken);
            }
          } catch (e) {
            console.error('Error parsing state parameter:', e);
          }
        }
      }

      if (error) {
        console.error('Authentication error:', error);
        this.authPromiseResolver.reject(new Error(`Authentication failed: ${error}`));
      } else if (idToken) {
        console.log('ID token found in deep link, resolving promise');
        this.authPromiseResolver.resolve(idToken);
      } else {
        console.error('No ID token found in redirect URL');
        this.authPromiseResolver.reject(new Error('No ID token found in redirect URL'));
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
      this.authPromiseResolver.reject(new Error('Failed to process authentication response'));
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
    const redirectUrl = 'https://onboarding.oktostage.com/__/auth/handler';
    const state = {
      redirect_uri: redirectUrl,
      platform: Platform.OS,
    };
  
    return super.loginUsingSocial(
      provider,
      state,
      async (url: string) => {
        console.log('Opening auth URL:', url);
        
        // Make sure any existing auth session is cleared
        if (this.authPromiseResolver) {
          console.warn('Existing auth session detected, clearing previous session');
          console.log('KARAN :: Rejecting previous auth promise resolver');
          this.authPromiseResolver.reject(new Error('Auth session replaced by new request'));
          this.authPromiseResolver = null;
        }
        
        return new Promise<string>((resolve, reject) => {
          this.authPromiseResolver = { resolve, reject };
          
          // Set timeout for auth flow
          const authTimeout = setTimeout(() => {
            if (this.authPromiseResolver) {
              console.warn('Authentication timed out');
              this.authPromiseResolver.reject(new Error('Authentication timed out'));
              this.authPromiseResolver = null;
              
              try {
                WebBrowser.dismissAuthSession();
              } catch (error) {
                console.error('Error dismissing auth session on timeout:', error);
              }
            }
          }, 300000); // 5 minute timeout
          
          // Open auth URL in browser
          WebBrowser.openAuthSessionAsync(url, redirectUrl, {
            showInRecents: true,
            createTask: false,
            preferEphemeralSession: true,
          })
          .then((result) => {
            clearTimeout(authTimeout);
            console.log('KARAN :: WebBrowser session ended with result:', result.type);
            
            // Only handle dismissal if still have an active resolver
            if (this.authPromiseResolver && result.type === 'dismiss') {
              console.warn('User dismissed the auth session');
              this.authPromiseResolver.reject(new Error('User canceled authentication'));
              this.authPromiseResolver = null;
            }
          })
          .catch((error) => {
            clearTimeout(authTimeout);
            console.error('Error in WebBrowser session:', error);
            
            if (this.authPromiseResolver) {
              this.authPromiseResolver.reject(error);
              this.authPromiseResolver = null;
            }
          });
        });
      }
    );
  }

  override sessionClear(): void {
    clearStorage('okto_session');
    super.sessionClear();

    // Clear any active authentication
    if (this.authPromiseResolver) {
      this.authPromiseResolver.reject(new Error('Session cleared during authentication'));
      this.authPromiseResolver = null;
    }

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