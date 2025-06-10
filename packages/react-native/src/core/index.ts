import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import { RpcError } from '@okto_web3/core-js-sdk/errors';
import type {
  Address,
  AuthData,
  OnrampOptions,
  SocialAuthType,
} from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import { logger } from '../utils/logger.js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  createExpoBrowserHandler,
  type AuthPromiseResolver,
} from '../utils/authBrowserUtils.js';
import { RemoteConfigService } from '../webview/onRamp/onRampRemoteConfig.js';
import type { UIConfig } from 'src/webview/authentication/types.js';

interface NavigationProps {
  navigate: (screen: string, params: unknown) => void;
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

  override loginUsingEmail(
    email: string,
    otp: string,
    token: string,
    onSuccess?: (session: SessionConfig) => void,
    overrideSessionConfig?: SessionConfig | undefined,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingEmail(
      email,
      otp,
      token,
      (session) => {
        setStorage('okto_session', JSON.stringify(session));
        this.setSessionConfig(session);
        onSuccess?.(session);
      },
      overrideSessionConfig,
    );
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

    try {
      WebBrowser.maybeCompleteAuthSession();
      await WebBrowser.warmUpAsync();
    } catch (error) {
      logger.error('[OktoClient] Error preparing browser:', error);
    }

    try {
      return await super.loginUsingSocial(
        provider,
        state,
        createExpoBrowserHandler(redirectUrl, this.authPromiseResolverRef),
      );
    } catch (error) {
      logger.error('[OktoClient] Social login error:', error);
      throw error;
    } finally {
      try {
        await WebBrowser.coolDownAsync();
      } catch (error) {
        logger.error('[OktoClient] Error cooling down browser:', error);
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

      logger.log('[OktoClient] Apple Sign-In successful:', {
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

      logger.log('[OktoClient] Apple authentication completed successfully');
      return result;
    } catch (error) {
      logger.error('Error logging in using apple: ', error);
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

  public openWebView(
    navigation: NavigationProps,
    redirectUrl: string,
    uiConfig?: UIConfig,
  ): void {
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
      uiConfig,
      onWebViewClose: () => {
        const newClient = new OktoClient(this.config);
        logger.log('Client SWA After Login', newClient.clientSWA);
        this.initializeSession();
      },
    });
  }

  /**
   * Open OnRamp screen for purchasing tokens
   */
  public async openOnRamp(
    navigation: NavigationProps,
    tokenId: string,
    options: OnrampOptions & {
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
      onClose?: () => void;
    } = {},
  ): Promise<void> {
    try {
      const remoteConfig = RemoteConfigService.getInstance();
      const config = await remoteConfig.getOnrampConfig();

      if (!config.onRampEnabled) {
        throw new Error('OnRamp is currently disabled');
      }

      // Prepare onramp options
      const onrampOptions: OnrampOptions = {
        theme: config.theme,
        countryCode: config.countryCode,
        appVersion: config.appVersion,
        screenSource: 'portfolio_screen',
        ...options,
      };

      // Generate OnRamp URL
      const url = await this.generateOnrampUrl(tokenId, onrampOptions);

      if (!url) {
        throw new Error('Failed to generate OnRamp URL');
      }

      // Navigate to OnRamp screen
      navigation.navigate('OnRampScreen', {
        url,
        tokenId,
        oktoClient: this,
        onClose: options.onClose || (() => {}),
        onSuccess: options.onSuccess,
        onError: options.onError,
      });
    } catch (error) {
      console.error('[OktoClient] OnRamp error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to open OnRamp';
      options.onError?.(errorMessage);
      throw error;
    }
  }
}

export { OktoClient };
export type { OktoClientConfig };
