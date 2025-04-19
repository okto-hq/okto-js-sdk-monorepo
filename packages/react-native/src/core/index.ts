// src/core/OktoClient.ts
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
import { SocialAuthUrlGenerator } from '@okto_web3/core-js-sdk/authentication';

class OktoClient extends OktoCoreClient {
  private readonly config: OktoClientConfig;
  private deepLinkSubscription: EmitterSubscription | null = null;

  constructor(config: OktoClientConfig) {
    super(config);
    this.config = config;
    this.initializeSession();
  }

  private initializeSession(): void {
    const session = getStorage('okto_session');
    if (session) {
      try {
        this.setSessionConfig(JSON.parse(session));
        this.syncUserKeys();
      } catch (error) {
        console.error('Error initializing session:', error);
      }
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
    navigation: any,
  ): Promise<Address | RpcError | undefined> {
    if (!navigation) {
      throw new Error('Navigation reference not set');
    }

    const redirectUrl = 'oktosdk://auth';
    const state = {
      redirect_uri: redirectUrl,
      platform: Platform.OS,
    };

    return new Promise((resolve, reject) => {
      // Create a handler for the WebView to communicate back
      const handleWebViewResponse = (event: { url: string }) => {
        if (!event.url.startsWith(redirectUrl)) return;

        try {
          const urlObj = new URL(event.url);
          const idToken = urlObj.searchParams.get('id_token');
          const error = urlObj.searchParams.get('error');

          if (error) {
            reject(new Error(`Authentication failed: ${error}`));
            return;
          }

          if (idToken) {
            // Complete the auth flow with the parent class
            super.loginUsingSocial(provider, state, async () => idToken)
              .then(resolve)
              .catch(reject);
          }
        } catch (error) {
          reject(new Error('Failed to process authentication response'));
        } finally {
          // Navigate back after auth completes
          navigation?.current?.goBack();
        }
      };

      // Generate the auth URL (you'll need to implement this)
      const authUrl =   SocialAuthUrlGenerator.generateAuthUrl(provider, state);
      // ;

      // Navigate to WebView screen
      navigation.current?.navigate('AuthWebView', {
        url: authUrl,
        onUrlChange: handleWebViewResponse,
        onClose: () => reject(new Error('Authentication cancelled by user')),
      });
    });
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
      }
    });
  }

  override sessionClear(): void {
    // this.cleanupDeepLinkListener();
    clearStorage('okto_session');
    super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };