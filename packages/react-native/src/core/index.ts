import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import { RpcError } from '@okto_web3/core-js-sdk/errors';
import type {
  Address,
  AuthData,
  SocialAuthType,
} from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  createExpoBrowserHandler,
  type AuthPromiseResolver,
} from '../utils/authBrowserUtils.js';

interface NavigationProps {
  navigate: (
    screen: string,
    params: {
      url: string;
      clientConfig: OktoClientConfig;
      redirectUrl: string;
      onWebViewClose: () => void;
    },
  ) => void;
}

class OktoClient extends OktoCoreClient {
  private readonly config: OktoClientConfig;
  private authPromiseResolverRef: { current: AuthPromiseResolver } = {
    current: null,
  };

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
      } catch {
        clearStorage('okto_session');
      }
    }
  }

  private getAuthPageUrl(): string {
    const { env } = this;
    if (!env.authPageUrl) {
      throw new Error(
        '[OktoClient] Authentication page URL is not configured for this environment',
      );
    }
    return env.authPageUrl;
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
    provider: SocialAuthType,
    options: { redirectUrl: string },
  ): Promise<Address | RpcError | undefined> {
    if (!options?.redirectUrl) {
      throw new Error('[OktoClient] redirectUrl is required for social login');
    }

    const redirectUrl = options.redirectUrl;
    const state = {
      client_url: redirectUrl,
      platform: Platform.OS,
    };

    // Clean up any existing sessions
    try {
      WebBrowser.maybeCompleteAuthSession();
      await WebBrowser.warmUpAsync();
    } catch (error) {
      console.error('[OktoClient] Error preparing browser:', error);
    }

    try {
      return await super.loginUsingSocial(
        provider,
        state,
        createExpoBrowserHandler(redirectUrl, this.authPromiseResolverRef),
      );
    } catch (error) {
      console.error('[OktoClient] Social login error:', error);
      throw error;
    } finally {
      try {
        await WebBrowser.coolDownAsync();
      } catch (error) {
        console.error('[OktoClient] Error cooling down browser:', error);
      }
    }
  }

  /**
   * Apple Authentication
   *
   * Performs Apple Sign-In and uses the identity token with Okto's OAuth login
   * @param onSuccess Callback function called when authentication is successful
   * @returns Promise resolving to user address or RPC error
   */
  public async loginUsingApple(
    onSuccess?: (session: SessionConfig) => void,
  ): Promise<Address | RpcError | undefined> {
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Authentication is not available on this device');
      }
      const appleAuthResult = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('[OktoClient] Apple Sign-In successful:', {
        user: appleAuthResult.user,
        email: appleAuthResult.email,
        fullName: appleAuthResult.fullName,
        hasIdentityToken: !!appleAuthResult.identityToken,
      });

      const idToken = appleAuthResult.identityToken;
      if (!idToken) {
        throw new Error('No identity token received from Apple authentication');
      }

      const authData: AuthData = {
        provider: 'apple',
        idToken: idToken,
      };

      const result = await this.loginUsingOAuth(authData, (session) => {
        onSuccess?.(session);
      });

      console.log('[OktoClient] Apple authentication completed successfully');
      return result;
    } catch (error) {
      console.error('Error logging in using apple: ', error);
      if (error instanceof RpcError) {
        return error;
      }
      throw error;
    }
  }

  override sessionClear(): void {
    clearStorage('okto_session');
    return super.sessionClear();
  }

  public openWebView(navigation: NavigationProps, redirectUrl: string): void {
    if (!redirectUrl) {
      throw new Error(
        '[OktoClient] redirectUrl is required for WebView authentication',
      );
    }

    const authUrl = this.getAuthPageUrl();
    navigation.navigate('WebViewScreen', {
      url: authUrl,
      clientConfig: this.config,
      redirectUrl,
      onWebViewClose: () => {
        const newClient = new OktoClient(this.config);
        console.log('Client SWA After Login', newClient.clientSWA);
        this.initializeSession();
      },
    });
  }
}

export { OktoClient };
export type { OktoClientConfig };
