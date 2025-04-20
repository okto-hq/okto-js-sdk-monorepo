import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

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
        const parsedSession = JSON.parse(session);
        this.setSessionConfig(parsedSession);
        this.syncUserKeys();
      } catch (error) {
        console.error('Error initializing session:', error);
        clearStorage('okto_session');
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
        
        const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl, {
          showInRecents: true,
          preferEphemeralSession: true,
        });
        
        console.log('KARAN Auth session result type :', result.type);
        if ('url' in result) {
          console.log('KARAN Auth session result URL:', result.url);
        }

        if (result.type === 'success'
        ) {
          console.log('Auth session success:', result.url);
          return this.extractIdTokenFromUrl(result.url);
        } else if (result.type === 'dismiss') {
          throw new Error('User canceled authentication');
        } else {
          throw new Error('Authentication failed');
        }
      }
    );
  }

  private extractIdTokenFromUrl(url: string): string {
    console.log('Processing redirect URL:', url);
    
    // Try to get from URL fragment first (after #)
    if (url.includes('#')) {
      const fragmentParams = new URLSearchParams(url.split('#')[1]);
      const fragmentToken = fragmentParams.get('id_token');
      if (fragmentToken) return fragmentToken;
    }
    
    // Then try URL parameters (after ?)
    if (url.includes('?')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const paramToken = urlParams.get('id_token');
      if (paramToken) return paramToken;
    }
    
    // Finally check state parameter
    const stateParam = new URLSearchParams(url.split('?')[1] || url.split('#')[1] || '').get('state');
    if (stateParam) {
      try {
        const state = JSON.parse(decodeURIComponent(stateParam));
        if (state?.id_token) {
          return state.id_token;
        }
      } catch (e) {
        console.error('Error parsing state parameter:', e);
      }
    }
    
    throw new Error('No ID token found in redirect URL');
  }

  override sessionClear(): void {
    clearStorage('okto_session');
    super.sessionClear();
    // WebBrowser.dismissAuthSession().catch(() => {});
  }

  public destroy(): void {
    this.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };