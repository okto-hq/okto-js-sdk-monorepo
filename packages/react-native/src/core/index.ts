// src/core/OktoClient.ts
import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import { Platform} from 'react-native';
import { SocialAuthUrlGenerator } from '@okto_web3/core-js-sdk/authentication';

class OktoClient extends OktoCoreClient {
  private readonly config: OktoClientConfig;

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

  public async loginWithGoogleInApp(
    navigation: any,
    onSuccess?: (session: SessionConfig) => void,
  ): Promise<Address | RpcError | undefined> {
    const redirectUrl = 'oktosdk://auth';
    const state = {
      redirect_uri: redirectUrl,
      platform: Platform.OS,
    };

    try {
      const authUrl = SocialAuthUrlGenerator.generateAuthUrl("google",state);
      return new Promise((resolve, reject) => {
        const handleNavigation = (navState: any) => {
          if (navState.url && navState.url.startsWith(redirectUrl)) {
            try {
              const urlObj = new URL(navState.url);
              const idToken = urlObj.searchParams.get('id_token');
              const provider = "google";
              const error = urlObj.searchParams.get('error');
              
              if (error) {
                reject(new Error(`Authentication failed: ${error}`));
                return;
              }

              if (idToken) {
                this.loginUsingOAuth({ idToken, provider}, (session) => {
                  setStorage('okto_session', JSON.stringify(session));
                  this.setSessionConfig(session);
                  onSuccess?.(session);
                });
              }
            } catch (error) {
              reject(error);
            }
          }
        };

        navigation.navigate('WebViewScreen', {
          url: authUrl,
          clientConfig: this.config,
          handleNavigation: handleNavigation,
        });
      });
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
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
    clearStorage('okto_session');
    super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };