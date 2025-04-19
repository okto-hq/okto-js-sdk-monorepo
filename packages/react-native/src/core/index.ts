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
import InAppBrowser from 'react-native-inappbrowser-reborn';

class OktoClient extends OktoCoreClient {
  private readonly config: OktoClientConfig;
  constructor(config: OktoClientConfig) {
    super(config);
    this.config = config;
    this.initializeSession();
  }

  private initializeSession(): void {
    const session = getStorage('okto_session_whatsapp');
    console.log('KARAN:: Session from storage:', session);
    if (session) {
      console.log('karan is here in inilialize session', session);
      this.setSessionConfig(JSON.parse(session));
      this.syncUserKeys();
    }
  }

  /**
   * Override of OAuth login to persist session in storage
   * @param data Authentication data
   * @param onSuccess Optional callback on successful authentication
   * @returns Promise resolving to user address or error
   */

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


  override loginUsingSocial(
    provider: 'google',
  ): Promise<Address | RpcError | undefined> {
    // Use the redirect URL that matches your Android manifest
    const redirectUrl = 'oktosdk://auth';
    
    // Add platform-specific properties to state
    const state = {
      redirect_uri: 'oktosdk://auth', // Match your deep link scheme
      platform: Platform.OS, // 'ios' or 'android'
      // Add any additional state parameters you need
    };
    
    // Create a React Native specific implementation of overrideOpenWindow
    const reactNativeOpenWindow = async (url: string): Promise<string> => {
      return new Promise<string>(async (resolve, reject) => {
        // Set up URL event listener with the modern subscription API
        const subscription = Linking.addListener('url', (event: { url: string }) => {
          if (event.url.startsWith('oktosdk://auth')) {
            try {
              const urlObj = new URL(event.url);
              const idToken = urlObj.searchParams.get('id_token');
              
              if (idToken) {
                // Clean up listener
                subscription.remove();
                // Close browser if still open
                InAppBrowser.close();
                resolve(idToken);
              }
            } catch (error) {
              console.error('Error parsing callback URL:', error);
              subscription.remove();
              reject(error);
            }
          }
        });
        
        try {
          // Check if InAppBrowser is available
          const isAvailable = await InAppBrowser.isAvailable();
          
          if (isAvailable) {
            // Open URL in InAppBrowser
            const result = await InAppBrowser.openAuth(url, redirectUrl, {
              showTitle: true,
              enableUrlBarHiding: true,
              enableDefaultShare: false,
              ephemeralWebSession: false,
              toolbarColor: '#2196F3',
              secondaryToolbarColor: 'black',
              preferredBarTintColor: 'white',
              preferredControlTintColor: 'white',
            });
            
            if (result.type === 'cancel' || result.type === 'dismiss') {
              subscription.remove();
              reject(new Error('Authentication was cancelled'));
            } else if (result.type === 'success' && result.url) {
              // For some implementations, the token might be directly in the success URL
              const urlObj = new URL(result.url);
              const idToken = urlObj.searchParams.get('id_token');
              if (idToken) {
                subscription.remove();
                resolve(idToken);
              }
            }
          } else {
            // Fall back to external browser if InAppBrowser is not available
            const supported = await Linking.canOpenURL(url);
            
            if (supported) {
              await Linking.openURL(url);
            } else {
              subscription.remove();
              reject(new Error('Cannot open authentication URL'));
            }
          }
        } catch (error) {
          subscription.remove();
          reject(error);
        }
      });
    };
    
    // Call the parent class's method with our React Native specific implementation
    return super.loginUsingSocial(provider, state, reactNativeOpenWindow);
  }

  /**
   * Opens a WebView for authentication flows
   * @param url URL to open in WebView
   * @param navigation Navigation object to navigate to WebView screen
   */
  public openWebView = (url: string, navigation: any): void => {
    navigation.navigate('WebViewScreen', {
      url,
      clientConfig: this.config,
    });

    console.log('Navigating to WebViewScreen with:', {
      url,
      clientConfig: this.config,
    });
  };

  override sessionClear(): void {
    clearStorage('okto_session');
    return super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };
