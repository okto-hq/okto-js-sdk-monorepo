// OktoClient.ts
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

class OktoClient extends OktoCoreClient {
  private readonly config: OktoClientConfig;
  private authPromiseResolverRef: { current: AuthPromiseResolver } = {
    current: null,
  };
  private navigationUnsubscribe: (() => void) | null = null;

  constructor(config: OktoClientConfig) {
    super(config);
    this.config = config;
    this.initializeSession();
  }

  private initializeSession(): void {
    const session = getStorage('okto_session');
    if (session) {
      try {
        console.log('[OktoClient] Found existing session:', session);
        const parsedSession = JSON.parse(session);
        this.setSessionConfig(parsedSession);
        console.log('[OktoClient] Session initialized:', parsedSession);
        this.syncUserKeys();
      } catch (error) {
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
  ): Promise<Address | RpcError | undefined> {
    const redirectUrl = 'oktosdk://auth';
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

  public openWebView(url: string, navigation: any): void {
    console.log('[OktoClient] Opening WebView with URL:', url);
    
    // Clean up any existing listener
    if (this.navigationUnsubscribe) {
      this.navigationUnsubscribe();
      this.navigationUnsubscribe = null;
    }
    
    // Set up a one-time listener that auto-cleans
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      console.log('[OktoClient] Navigation event detected', e.target.route.name);
      
      // Only refresh if we're coming back from WebViewScreen
      if (e.target.route.name === 'WebViewScreen') {
        console.log('[OktoClient] Detected navigation from WebView, refreshing session');
        
        // Use setTimeout to ensure this runs after the navigation completes
        setTimeout(() => {
          console.log('[OktoClient] Refreshing session after WebView navigation');
          this.initializeSession();
        }, 100);
      }
      
      // Clean up the listener after it fires
      if (this.navigationUnsubscribe) {
        this.navigationUnsubscribe();
        this.navigationUnsubscribe = null;
      }
    });
    
    // Store the unsubscribe function
    this.navigationUnsubscribe = unsubscribe;
    
    // Navigate to WebView
    navigation.navigate('WebViewScreen', {
      url,
      clientConfig: this.config,
    });
  }
}

export { OktoClient };
export type { OktoClientConfig };
