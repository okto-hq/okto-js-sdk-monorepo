import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type {
  Address,
  AuthData,
  SocialAuthType,
} from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
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
    options?: { redirectUrl?: string },
  ): Promise<Address | RpcError | undefined> {
    const redirectUrl = options?.redirectUrl || 'oktosdk://auth';
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
    }
  }

  override sessionClear(): void {
    clearStorage('okto_session');
    return super.sessionClear();
  }

  public openWebView(url: string, navigation: NavigationProps): void {
    navigation.navigate('WebViewScreen', {
      url,
      clientConfig: this.config,
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
