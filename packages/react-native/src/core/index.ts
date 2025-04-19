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
  ): Promise<Address | RpcError | undefined> {
    const redirectUrl = 'oktosdk://auth';
    const state = {
      redirect_uri: redirectUrl,
      platform: Platform.OS,
    };

    try {
      return await super.loginUsingSocial(
        provider,
        state,
        this.createAuthWindowHandler(redirectUrl)
      );
    } catch (error) {
      console.error('Social login error:', error);
    } finally {
      this.cleanupDeepLinkListener();
    }
  }

  private createAuthWindowHandler(redirectUrl: string): (url: string) => Promise<string> {
    return (authUrl: string) => {
      return new Promise<string>(async (resolve, reject) => {
        // Set up deep link listener
        this.deepLinkSubscription = Linking.addListener('url', (event) => {
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
              resolve(idToken);
            }
          } catch (error) {
            reject(new Error('Failed to process authentication response'));
          } finally {
            this.cleanupDeepLinkListener();
          }
        });

        // Open the authentication URL in the device browser
        try {
          const supported = await Linking.canOpenURL(authUrl);
          if (!supported) {
            throw new Error(`Cannot open URL: ${authUrl}`);
          }
          await Linking.openURL(authUrl);
        } catch (error) {
          this.cleanupDeepLinkListener();
          reject(error);
        }
      });
    };
  }

  private cleanupDeepLinkListener(): void {
    if (this.deepLinkSubscription) {
      this.deepLinkSubscription.remove();
      this.deepLinkSubscription = null;
    }
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
    this.cleanupDeepLinkListener();
    clearStorage('okto_session');
    super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };