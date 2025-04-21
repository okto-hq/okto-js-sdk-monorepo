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
      // Set up listener for URL events before opening browser
      const subscription = Linking.addEventListener('url', this.handleRedirectUrl);
      
      // Base URL for Google OAuth
      const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      
      // Define redirect URI for your app
      const redirectUri = 'https://onboarding.oktostage.com/__/auth/handler';
      
      // Generate a random nonce for security
      const nonce = this.generateNonce();
      
      // Generate the state parameter with platform info and redirect URI
      const state = JSON.stringify({
        redirect_uri: "oktosdk://auth", // Your app's custom scheme
        platform: Platform.OS // 'android' or 'ios'
      });
      
      // Create params object with all required OAuth parameters
      const params = new URLSearchParams({
        scope: 'openid email profile',
        redirect_uri: redirectUri,
        response_type: 'id_token',
        client_id: '54780876714-t59u4t7r1pekdj3p54grd9nh4rfg8qvd.apps.googleusercontent.com',
        nonce: 'b703d535-bc46-4911-8aa3-25fb6c19e2ce',
        state: state,
      });
      
      // Build the complete auth URL
      const authUrl = `${baseUrl}?${params.toString()}`;
      
      console.log('Opening Google Auth URL:', authUrl);
      
      // Use maybeCompleteAuthSession before opening browser
      WebBrowser.maybeCompleteAuthSession();
      
      // Log redirect URL for debugging
      console.log('Redirect URL:', "oktosdk://auth");
      
      try {
        // Open the authentication URL in the browser
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectUri // This is your app's custom URL scheme
        );
        
        console.log('WebBrowser result:', JSON.stringify(result));
        
        if (result.type === 'success') {
          // Handle successful authentication via the result
          const { url } = result;
          await this.processAuthUrl(url);
        } else {
          // The browser was dismissed without a success callback
          console.log('Authentication flow was not completed successfully:', result.type);
          
          // We'll rely on the Linking event listener for the redirect
          console.log('Waiting for redirect via Linking...');
          // Don't throw error yet - we might still get the redirect via Linking
        }
      } finally {
        // Clean up the subscription when done
        subscription.remove();
      }
    } catch (error) {
      console.error('Auth error:', error);
      throw new Error('Failed to authenticate with Google: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  // Handle redirect URL from either WebBrowser result or Linking event
  private async processAuthUrl(url: string): Promise<void> {
    try {
      console.log('Processing auth URL:', url);
      
      // Parse the URL to extract the id_token
      const idToken = this.extractIdTokenFromUrl(url);
      
      if (idToken) {
        console.log('ID Token received:', idToken);
        setStorage('auth_token', idToken);
        
        // Call your login method
        await this.loginUsingOAuth(
          { 
            idToken: idToken, 
            provider: 'google' 
          },
          (session) => {
            console.log('Login successful:', session);
          }
        );
      } else {
        console.warn('No id_token found in the response');
        throw new Error('No ID token found in the response');
      }
    } catch (error) {
      console.error('Error processing auth URL:', error);
      throw error;
    }
  }
  
  // Handle redirect URL from Linking events
  private handleRedirectUrl = async (event: { url: string }): Promise<void> => {
    try {
      const { url } = event;
      console.log('Received redirect URL:', url);
      
      // Only process URLs with our custom scheme
      if (url.startsWith('https://onboarding')) {
        console.log('Received redirect via Linking event:', url);
        await this.processAuthUrl(url);
      }
    } catch (error) {
      console.error('Error handling redirect URL:', error);
    }
  };
  
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

  private generateNonce(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset[randomIndex];
    }
    
    return result;
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