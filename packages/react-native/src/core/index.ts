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
import * as WebBrowser from 'expo-web-browser';

class OktoClient extends OktoCoreClient {
  private readonly config: OktoClientConfig;
  private deepLinkSubscription: EmitterSubscription | null = null;
  private authPromiseResolver: {
    resolve: (value: string) => void;
    reject: (reason: Error) => void;
  } | null = null;

  constructor(config: OktoClientConfig) {
    super(config);
    this.config = config;
    console.log('[OktoClient] Initializing with config:', JSON.stringify(config));
    this.initializeSession();
    this.initializeDeepLinkHandlers();
    this.setupDeepLinkTest();
  }

  /**
   * Test deep linking setup when app initializes
   */
  private setupDeepLinkTest(): void {
    // Check if deep linking is properly set up
    Linking.canOpenURL('oktosdk://auth?test=true')
      .then(supported => {
        console.log('[OktoClient] Deep link scheme supported:', supported);
        if (!supported) {
          console.warn('[OktoClient] WARNING: Deep link scheme "oktosdk" is not supported. Authentication redirect may fail.');
        }
      })
      .catch(error => {
        console.error('[OktoClient] Error checking deep link support:', error);
      });
  }

  private initializeSession(): void {
    console.log('[OktoClient] Initializing session from storage');
    const session = getStorage('okto_session');
    if (session) {
      try {
        console.log('[OktoClient] Found stored session, restoring');
        const parsedSession = JSON.parse(session);
        this.setSessionConfig(parsedSession);
        this.syncUserKeys();
        console.log('[OktoClient] Session restored successfully');
      } catch (error) {
        console.error('[OktoClient] Error initializing session:', error);
        console.log('[OktoClient] Clearing invalid session data');
        clearStorage('okto_session');
      }
    } else {
      console.log('[OktoClient] No stored session found');
    }
  }

  private initializeDeepLinkHandlers(): void {
    console.log('[OktoClient] Setting up deep link handlers');
    
    // Register for initial deep link that might have launched the app
    Linking.getInitialURL()
      .then((url) => {
        console.log('[OktoClient] Initial URL:', url);
        if (url) {
          console.log('[OktoClient] Handling initial deep link');
          this.handleDeepLink(url);
        }
      })
      .catch((error) => console.error('[OktoClient] Error getting initial URL:', error));

    // Register for deep links received while app is running
    this.deepLinkSubscription = Linking.addListener('url', (event) => {
      console.log('[OktoClient] Deep link received:', event.url);
      this.handleDeepLink(event.url);
    });
    
    console.log('[OktoClient] Deep link handlers initialized');
  }

  private handleDeepLink(url: string | null): void {
    console.log('[OktoClient] Processing deep link:', url);
    
    if (!url) {
      console.log('[OktoClient] Ignoring empty deep link');
      return;
    }
    
    // Check if we need to handle an onboarding redirect URL
    if (url.includes('onboarding.oktostage.com/auth/handler')) {
      console.log('[OktoClient] Detected onboarding redirect URL');
      this.extractAndUseTokenFromUrl(url);
      return;
    }
    
    if (!url.startsWith('oktosdk://auth')) {
      console.log('[OktoClient] Ignoring deep link with wrong scheme:', url);
      return;
    }
    
    if (!this.authPromiseResolver) {
      console.log('[OktoClient] Ignoring deep link - no active auth promise resolver');
      return;
    }

    try {
      console.log('[OktoClient] Parsing deep link URL');
      
      // Extract token from URL - handle both query params and URL fragments
      let idToken = null;
      let error = null;
      
      // First try to extract from query params
      if (url.includes('?')) {
        try {
          const urlObj = new URL(url);
          // Log all parameters for debugging
          const params: { [key: string]: string } = {};
          urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
          });
          console.log('[OktoClient] Deep link params:', JSON.stringify(params));
          
          idToken = urlObj.searchParams.get('id_token');
          error = urlObj.searchParams.get('error');
        } catch (e) {
          console.error('[OktoClient] Error parsing URL as query params:', e);
        }
      }
      
      // If not found in query params, try to extract from URL fragment
      if (!idToken && url.includes('#')) {
        const fragmentPart = url.split('#')[1];
        if (fragmentPart) {
          // Create URLSearchParams from the fragment
          const fragmentParams = new URLSearchParams(fragmentPart);
          idToken = fragmentParams.get('id_token');
          error = fragmentParams.get('error');
          
          // Log fragment params for debugging
          const params: { [key: string]: string } = {};
          fragmentParams.forEach((value, key) => {
            params[key] = value;
          });
          console.log('[OktoClient] Fragment params:', JSON.stringify(params));
        }
      }
      
      // If still not found, try regex as last resort
      if (!idToken && url.includes('id_token=')) {
        const tokenMatch = url.match(/[?&#]id_token=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          idToken = tokenMatch[1];
          console.log('[OktoClient] Extracted id_token using regex');
        }
      }
      
      if (!error && url.includes('error=')) {
        const errorMatch = url.match(/[?&#]error=([^&]+)/);
        if (errorMatch && errorMatch[1]) {
          error = errorMatch[1];
        }
      }

      if (error) {
        console.error('[OktoClient] Auth error from deep link:', error);
        this.authPromiseResolver.reject(
          new Error(`Authentication failed: ${error}`),
        );
        return;
      }

      if (idToken) {
        console.log('[OktoClient] Auth successful, received id_token');
        this.authPromiseResolver.resolve(idToken);
      } else {
        console.error('[OktoClient] No id_token found in redirect URL');
        this.authPromiseResolver.reject(
          new Error('No id_token found in redirect URL'),
        );
      }
    } catch (error) {
      console.error('[OktoClient] Failed to process deep link:', error);
      this.authPromiseResolver.reject(
        new Error('Failed to process authentication response'),
      );
    } finally {
      console.log('[OktoClient] Clearing auth promise resolver');
      this.authPromiseResolver = null;
    }
  }

  /**
   * Extract the ID token from a URL and use it to complete the authentication process
   */
  public async extractAndUseTokenFromUrl(url: string): Promise<boolean> {
    console.log('[OktoClient] Extracting token from URL:', url);
    
    try {
      // Extract the ID token from the URL fragment
      let idToken = null;
      
      // Try to extract from URL fragment
      if (url.includes('#')) {
        const fragmentPart = url.split('#')[1];
        if (fragmentPart) {
          const fragmentParams = new URLSearchParams(fragmentPart);
          idToken = fragmentParams.get('id_token');
        }
      }
      
      // If not found in fragment, try regex
      if (!idToken && url.includes('id_token=')) {
        const tokenMatch = url.match(/[?&#]id_token=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          idToken = tokenMatch[1];
        }
      }
      
      if (idToken) {
        console.log('[OktoClient] Successfully extracted ID token');
        
        // If we have an active auth promise resolver, resolve it
        if (this.authPromiseResolver) {
          console.log('[OktoClient] Resolving auth promise with extracted token');
          this.authPromiseResolver.resolve(idToken);
          this.authPromiseResolver = null;
          return true;
        } else {
          console.log('[OktoClient] No active auth promise resolver, using token directly');
          // Use the token to complete the login flow
          await this.manualLoginWithToken(idToken);
          return true;
        }
      } else {
        console.error('[OktoClient] No ID token found in URL');
      }
    } catch (error) {
      console.error('[OktoClient] Error extracting and using token:', error);
    }
    
    return false;
  }

  /**
   * Handle the redirect from onboarding page to app
   */
  public async handleOnboardingRedirect(url: string): Promise<boolean> {
    console.log('[OktoClient] Handling onboarding redirect:', url);
    
    if (!url.includes('onboarding.oktostage.com/auth/handler')) {
      console.log('[OktoClient] Not an onboarding redirect URL');
      return false;
    }
    
    try {
      // Extract the ID token from the URL
      let idToken = null;
      const tokenMatch = url.match(/[?&#]id_token=([^&]+)/);
      if (tokenMatch && tokenMatch[1]) {
        idToken = tokenMatch[1];
        console.log('[OktoClient] Extracted ID token from onboarding URL');
        
        // Construct the deep link URL
        const deepLinkUrl = `oktosdk://auth?id_token=${idToken}`;
        
        // Try to open the deep link
        const canOpen = await Linking.canOpenURL(deepLinkUrl);
        if (canOpen) {
          console.log('[OktoClient] Opening deep link:', deepLinkUrl);
          await Linking.openURL(deepLinkUrl);
          return true;
        } else {
          console.error('[OktoClient] Cannot open deep link');
        }
      } else {
        console.error('[OktoClient] No ID token found in URL');
      }
    } catch (error) {
      console.error('[OktoClient] Error handling onboarding redirect:', error);
    }
    
    return false;
  }

  override loginUsingOAuth(
    data: AuthData,
    onSuccess?: (session: SessionConfig) => void,
  ): Promise<Address | RpcError | undefined> {
    console.log('[OktoClient] Logging in using OAuth');
    return super.loginUsingOAuth(data, (session) => {
      console.log('[OktoClient] OAuth login successful, storing session');
      setStorage('okto_session', JSON.stringify(session));
      this.setSessionConfig(session);
      onSuccess?.(session);
    });
  }

  override async loginUsingSocial(
    provider: 'google',
  ): Promise<Address | RpcError | undefined> {
    console.log(`[OktoClient] Starting social login with provider: ${provider}`);
    const redirectUrl = 'oktosdk://auth';
    const state = {
      redirect_uri: redirectUrl,
      platform: Platform.OS,
    };

    console.log('[OktoClient] Redirect URL:', redirectUrl);
    console.log('[OktoClient] State:', JSON.stringify(state));

    // Clean up any existing sessions
    try {
      console.log('[OktoClient] Attempting to complete any existing auth sessions');
      await WebBrowser.maybeCompleteAuthSession();
      console.log('[OktoClient] Warming up browser');
      await WebBrowser.warmUpAsync();
    } catch (error) {
      console.error('[OktoClient] Error preparing browser:', error);
    }

    try {
      console.log('[OktoClient] Calling super.loginUsingSocial with custom handler');
      return await super.loginUsingSocial(
        provider,
        state,
        this.createExpoBrowserHandler(redirectUrl),
      );
    } catch (error) {
      console.error('[OktoClient] Social login error:', error);
      throw error;
    } finally {
      // Make sure the browser is cooled down even if there's an error
      try {
        console.log('[OktoClient] Cooling down browser after login attempt');
        await WebBrowser.coolDownAsync();
      } catch (e) {
        console.error('[OktoClient] Error cooling down browser:', e);
      }
    }
  }

  private createExpoBrowserHandler(
    redirectUrl: string,
  ): (url: string) => Promise<string> {
    return async (authUrl: string) => {
      console.log('[OktoClient] Creating browser handler');
      console.log('[OktoClient] Auth URL:', authUrl);
      console.log('[OktoClient] Redirect URL:', redirectUrl);
      
      // Check if WebBrowser is available
      if (!WebBrowser) {
        console.error('[OktoClient] WebBrowser module is not available!');
        throw new Error('WebBrowser module is not available');
      }
      
      // Check if we can open the auth URL
      try {
        const canOpen = await Linking.canOpenURL(authUrl);
        console.log('[OktoClient] Can open auth URL:', canOpen);
        if (!canOpen) {
          console.warn('[OktoClient] Cannot open auth URL, this may cause issues');
        }
      } catch (error) {
        console.error('[OktoClient] Error checking if can open auth URL:', error);
      }
      
      // Check if we already have an auth session in progress
      if (this.authPromiseResolver) {
        console.warn('[OktoClient] Existing auth session detected, clearing previous session');
        if (this.authPromiseResolver) {
          this.authPromiseResolver.reject(
            new Error('Auth session replaced by new request'),
          );
          this.authPromiseResolver = null;
        }
      }

      // Create a new promise to handle the auth flow
      return new Promise<string>((resolve, reject) => {
        console.log('[OktoClient] Setting up auth promise resolver');
        this.authPromiseResolver = { resolve, reject };

        // Set a timeout for auth flow
        const authTimeout = setTimeout(() => {
          console.error('[OktoClient] Authentication timed out after 5 minutes');
          if (this.authPromiseResolver) {
            this.authPromiseResolver.reject(
              new Error('Authentication timed out'),
            );
            this.authPromiseResolver = null;
            
            // Cool down the browser
            WebBrowser.coolDownAsync()
              .then(() => console.log('[OktoClient] Browser cooled down after timeout'))
              .catch(error => console.error('[OktoClient] Error cooling down browser:', error));
          }
        }, 300000); // 5 minute timeout

        console.log('[OktoClient] Opening auth session in browser');
        
        // Open auth URL in the Expo WebBrowser with new handler for onboarding page
        WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
          showInRecents: true,
          createTask: false,
          preferEphemeralSession: true,
        })
          .then(async (result) => {
            console.log('[OktoClient] Browser session result:', JSON.stringify(result));
            clearTimeout(authTimeout);

            // The browser session ended, but we might have already processed the redirect
            // Check if we still have an active promise resolver
            if (this.authPromiseResolver) {
              if (result.type === 'success') {
                console.log('[OktoClient] Browser reports success, processing result URL');
                
                // If the result URL contains an id_token, extract it
                if (result.url) {
                  console.log('[OktoClient] Success URL:', result.url);
                  
                  // If the URL is from onboarding.oktostage.com, extract the token
                  if (result.url.includes('onboarding.oktostage.com/auth/handler')) {
                    console.log('[OktoClient] Extracting token from onboarding URL');
                    const wasExtracted = await this.extractAndUseTokenFromUrl(result.url);
                    if (wasExtracted) {
                      console.log('[OktoClient] Token successfully extracted and used');
                      return;
                    }
                  }
                  
                  // Try to extract from query params first
                  let idToken = null;
                  
                  // Try URLSearchParams if we have query parameters
                  if (result.url.includes('?')) {
                    try {
                      const urlObj = new URL(result.url);
                      idToken = urlObj.searchParams.get('id_token');
                    } catch (e) {
                      console.error('[OktoClient] Error parsing URL:', e);
                    }
                  }
                  
                  // Try to extract from URL fragment
                  if (!idToken && result.url.includes('#')) {
                    const fragmentPart = result.url.split('#')[1];
                    if (fragmentPart) {
                      // Create URLSearchParams from the fragment
                      const fragmentParams = new URLSearchParams(fragmentPart);
                      idToken = fragmentParams.get('id_token');
                    }
                  }
                  
                  // Last resort: regex
                  if (!idToken && result.url.includes('id_token=')) {
                    const tokenMatch = result.url.match(/[?&#]id_token=([^&]+)/);
                    if (tokenMatch && tokenMatch[1]) {
                      idToken = tokenMatch[1];
                      console.log('[OktoClient] Extracted id_token using regex from success URL');
                    }
                  }
                  
                  if (idToken && this.authPromiseResolver) {
                    console.log('[OktoClient] Extracted id_token from success URL');
                    this.authPromiseResolver.resolve(idToken);
                    this.authPromiseResolver = null;
                    return;
                  } else {
                    console.log('[OktoClient] No id_token found in success URL');
                  }
                }
              }
              
              if (result.type === 'dismiss' && this.authPromiseResolver) {
                console.log('[OktoClient] User dismissed the browser without completing auth');
                
                // Try to extract token from onboarding.oktostage.com if that's where we ended up
                // if (result.type && result.url.includes('onboarding.oktostage.com/auth/handler')) {
                //   console.log('[OktoClient] Found onboarding URL after dismiss, trying to extract token');
                //   const wasExtracted = await this.extractAndUseTokenFromUrl(result.url);
                //   if (wasExtracted) {
                //     console.log('[OktoClient] Successfully extracted and used token after dismiss');
                //     return;
                //   }
                // }
                
                // If we get here, we couldn't extract a token
                this.authPromiseResolver.reject(
                  new Error('User canceled authentication'),
                );
                this.authPromiseResolver = null;
              }
            } else {
              console.log('[OktoClient] No active promise resolver - auth may have completed via deep link');
            }
          })
          .catch((error) => {
            console.error('[OktoClient] Browser session error:', error);
            clearTimeout(authTimeout);

            if (this.authPromiseResolver) {
              this.authPromiseResolver.reject(error);
              this.authPromiseResolver = null;
            }
          })
          .finally(() => {
            // Make sure to clean up the browser
            WebBrowser.coolDownAsync().catch(console.error);
          });
      });
    };
  }

  /**
   * Manual OAuth login with a provided token
   * This can be used as a fallback when deep linking isn't working
   */
  public async manualLoginWithToken(idToken: string, provider: 'google' = 'google'): Promise<Address | RpcError | undefined> {
    console.log('[OktoClient] Performing manual login with provided token');
    
    try {
      // Create auth data for OAuth login
      const authData: AuthData = {
        idToken,
        provider,
      };

      // Perform OAuth login with the received token
      return await this.loginUsingOAuth(authData);
    } catch (error) {
      console.error('[OktoClient] Error during manual authentication:', error);
      throw error;
    }
  }

  override sessionClear(): void {
    console.log('[OktoClient] Clearing session');
    clearStorage('okto_session');
    super.sessionClear();

    // Clear any active authentication
    if (this.authPromiseResolver) {
      console.log('[OktoClient] Clearing active auth promise resolver');
      this.authPromiseResolver.reject(new Error('Session cleared'));
      this.authPromiseResolver = null;
    }

    // Close any open browser sessions
    try {
      console.log('[OktoClient] Attempting to dismiss auth session');
      WebBrowser.dismissAuthSession();
    } catch (error) {
      console.error('[OktoClient] Error dismissing auth session during clear:', error);
    }
  }

  public destroy(): void {
    console.log('[OktoClient] Destroying client instance');
    if (this.deepLinkSubscription) {
      console.log('[OktoClient] Removing deep link subscription');
      this.deepLinkSubscription.remove();
      this.deepLinkSubscription = null;
    }

    this.sessionClear();
    
    // Final cleanup
    try {
      console.log('[OktoClient] Cooling down browser');
      WebBrowser.coolDownAsync().catch(console.error);
    } catch (error) {
      console.error('[OktoClient] Error during final cleanup:', error);
    }
  }

  public openWebView(url: string, navigation: any): void {
    console.log('[OktoClient] Opening WebView with URL:', url);
    navigation.navigate('WebViewScreen', {
      url,
      clientConfig: this.config,
      onAuthSuccess: (session: SessionConfig) => {
        console.log('[OktoClient] WebView auth successful');
        setStorage('okto_session', JSON.stringify(session));
        this.setSessionConfig(session);
      },
      onAuthFailure: (error: Error) => {
        console.error('[OktoClient] WebView authentication failed:', error);
      },
    });
  }

  /**
   * Test deep linking functionality
   * Call this method from your app to verify deep linking is working
   */
  public testDeepLink(): void {
    const testUrl = 'oktosdk://auth?test=true&id_token=test_token';
    console.log('[OktoClient] Testing deep link:', testUrl);
    
    // Try to open the URL
    Linking.openURL(testUrl)
      .then(() => {
        console.log('[OktoClient] Test URL opened successfully');
      })
      .catch(error => {
        console.error('[OktoClient] Failed to open test URL:', error);
      });
  }

  /**
   * Test deep linking with a real token
   * Useful for debugging when the automatic flow isn't working
   */
  public testWithRealToken(token: string): void {
    const testUrl = `oktosdk://auth?id_token=${token}`;
    console.log('[OktoClient] Testing with real token:', testUrl);
    
    Linking.openURL(testUrl)
      .then(() => console.log('[OktoClient] Test with real token opened successfully'))
      .catch(error => console.error('[OktoClient] Failed to open with real token:', error));
  }

  /**
   * Get the current deep link handling status
   * Call this method to debug deep linking issues
   */
  public getDeepLinkStatus(): string {
    let status = {
      deepLinkListenerActive: !!this.deepLinkSubscription,
      authPromiseResolverActive: !!this.authPromiseResolver,
      platform: Platform.OS,
      redirectUrl: 'oktosdk://auth'
    };
    
    console.log('[OktoClient] Deep link status:', JSON.stringify(status));
    return JSON.stringify(status, null, 2);
  }
  
  /**
   * Force completion of the authentication process with a specific token
   * This can be used when the automated flow doesn't work and you need to manually
   * provide the token (for example, from the browser's URL)
   */
  public forceCompleteAuthWithToken(idToken: string): void {
    console.log('[OktoClient] Force completing authentication with provided token');
    
    if (this.authPromiseResolver) {
      console.log('[OktoClient] Resolving active auth promise with provided token');
      this.authPromiseResolver.resolve(idToken);
      this.authPromiseResolver = null;
    } else {
      console.log('[OktoClient] No active auth promise resolver, using manual login instead');
      this.manualLoginWithToken(idToken).catch(error => {
        console.error('[OktoClient] Manual login with token failed:', error);
      });
    }
  }
  
  /**
   * Extract token from a specific URL and handle browser cleanup
   * This can be called from a component that monitors WebBrowser navigation events
   */
  public async handleBrowserRedirect(url: string): Promise<boolean> {
    console.log('[OktoClient] Handling browser redirect:', url);
    
    // If URL contains token, extract it
    if (url && (url.includes('id_token=') || url.includes('onboarding.oktostage.com/auth/handler'))) {
      console.log('[OktoClient] URL contains token or is onboarding page, attempting to extract');
      const success = await this.extractAndUseTokenFromUrl(url);
      
      // Close the browser once we've extracted the token
      if (success) {
        console.log('[OktoClient] Successfully extracted token, dismissing browser');
        try {
          await WebBrowser.dismissAuthSession();
          await WebBrowser.coolDownAsync();
          return true;
        } catch (error) {
          console.error('[OktoClient] Error dismissing browser after token extraction:', error);
        }
      }
    }
    
    return false;
  }
}

export { OktoClient };
export type { OktoClientConfig };