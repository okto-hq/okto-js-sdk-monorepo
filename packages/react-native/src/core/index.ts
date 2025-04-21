import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import { Linking, Platform } from 'react-native';
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

  public async loginUsingGoogleAuth(): Promise<void> {
    try {
      const redirectUri = 'https://onboarding.oktostage.com/auth/handler';
      const customScheme = 'oktosdk://auth';

      const nonce = this.generateNonce();
      const state = encodeURIComponent(
        JSON.stringify({ redirect_uri: customScheme, platform: Platform.OS })
      );

      const params = new URLSearchParams({
        scope: 'openid email profile',
        redirect_uri: redirectUri,
        response_type: 'id_token',
        client_id: '54780876714-t59u4t7r1pekdj3p54grd9nh4rfg8qvd.apps.googleusercontent.com',
        nonce,
        state,
      });
      console.log('Google Auth URL Params:', params.toString());

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log('Google Auth URL:', authUrl);

      WebBrowser.maybeCompleteAuthSession();
      console.log('KARAN :: Opening Auth Session with URL:', authUrl);
      console.log('KARAN :: Custom Scheme:', customScheme);
      console.log('KARAN :: Redirect URI:', redirectUri);
      console.log('KARAN :: Platform:', Platform.OS);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, customScheme);
      console.log('KARAN :: Auth Session Result:', result);
      console.log('KARAN :: Auth Session Result: type ', result.type);
      

      if (result.type === 'success' && result.url) {
        const idToken = this.extractIdTokenFromUrl(result.url);
        if (!idToken) throw new Error('No ID token found in redirect URL');

        await this.loginUsingOAuth(
          { idToken, provider: 'google' },
          () => {
            Linking.openURL(customScheme);
          }
        );
      } else {
        throw new Error('Authentication was cancelled or failed');
      }
    } catch (err) {
      console.error('Google OAuth login failed:', err);
      throw err;
    }
  }

  private extractIdTokenFromUrl(url: string): string | null {
    try {
      const fragment = url.split('#')[1];
      if (!fragment) return null;

      const params = new URLSearchParams(fragment);
      return params.get('id_token');
    } catch (e) {
      console.error('Failed to parse redirect URL:', e);
      return null;
    }
  }

  private generateNonce(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  override sessionClear(): void {
    clearStorage('okto_session');
    clearStorage('auth_token');
    super.sessionClear();
  }

  public destroy(): void {
    this.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };
