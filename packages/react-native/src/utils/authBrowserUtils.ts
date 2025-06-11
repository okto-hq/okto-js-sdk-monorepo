import * as WebBrowser from 'expo-web-browser';
import { logger } from './logger.js';

export type AuthPromiseResolver = {
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
} | null;

/**
 * Creates a handler function for authentication using Expo's WebBrowser
 *
 * @param redirectUrl - The URL to redirect to after authentication
 * @param authPromiseResolverRef - Reference to the auth promise resolver
 * @returns A function that handles the authentication flow
 */
export function createExpoBrowserHandler(
  redirectUrl: string,
  authPromiseResolverRef: { current: AuthPromiseResolver },
): (url: string) => Promise<string> {
  return async (authUrl: string) => {
    // Check if we already have an auth session in progress
    if (authPromiseResolverRef.current) {
      logger.warn('Existing auth session detected, clearing previous session');
      authPromiseResolverRef.current.reject(
        new Error('Auth session replaced by new request'),
      );
      authPromiseResolverRef.current = null;
    }

    // Create a new promise to handle the auth flow
    return new Promise<string>((resolve, reject) => {
      authPromiseResolverRef.current = { resolve, reject };

      // Set a timeout for auth flow
      const authTimeout = setTimeout(() => {
        if (authPromiseResolverRef.current) {
          authPromiseResolverRef.current.reject(
            new Error('Authentication timed out'),
          );
          authPromiseResolverRef.current = null;

          WebBrowser.coolDownAsync()
            .then(() =>
              logger.log('[OktoClient] Browser cooled down after timeout'),
            )
            .catch((error) =>
              logger.error('[OktoClient] Error cooling down browser:', error),
            );
        }
      }, 300000); // 5 minute timeout

      // Open auth URL in the Expo WebBrowser
      WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
        showInRecents: true,
        createTask: false,
        preferEphemeralSession: true,
      })
        .then((result) => {
          clearTimeout(authTimeout);

          // The browser session ended, but we might have already processed the redirect
          // Check if we still have an active promise resolver
          if (authPromiseResolverRef.current) {
            if (result.type === 'success') {
              // If the URL contains an id_token, extract it (fallback mechanism)
              try {
                if (result.url && result.url.includes('id_token=')) {
                  const urlObj = new URL(result.url);
                  const idToken = urlObj.searchParams.get('id_token');
                  if (idToken) {
                    authPromiseResolverRef.current.resolve(idToken);
                    authPromiseResolverRef.current = null;
                    return;
                  }
                }
              } catch (error) {
                logger.error(
                  '[OktoClient] Error extracting token from success URL:',
                  error,
                );
              }
            }
            if (result.type === 'dismiss') {
              if (authPromiseResolverRef.current) {
                authPromiseResolverRef.current.reject(
                  new Error('User cancelled authentication'),
                );
                authPromiseResolverRef.current = null;
              }
            }
          } else {
            logger.log(
              '[OktoClient] No active promise resolver - auth may have completed via deep link',
            );
          }
        })
        .catch((error) => {
          logger.error('[OktoClient] Browser session error:', error);
          clearTimeout(authTimeout);

          if (authPromiseResolverRef.current) {
            authPromiseResolverRef.current.reject(error);
            authPromiseResolverRef.current = null;
          }
        });
    });
  };
}

/**
 * Creates a handler function for Apple authentication using WebBrowser (for Android)
 */
export function createAppleAuthHandler(
  redirectUrl: string,
  authPromiseResolverRef: { current: AuthPromiseResolver },
): (url: string) => Promise<string> {
  return async (authUrl: string) => {
    if (authPromiseResolverRef.current) {
      console.warn(
        'Existing Apple auth session detected, clearing previous session',
      );
      authPromiseResolverRef.current.reject(
        new Error('Apple auth session replaced by new request'),
      );
      authPromiseResolverRef.current = null;
    }

    return new Promise<string>((resolve, reject) => {
      authPromiseResolverRef.current = { resolve, reject };

      const authTimeout = setTimeout(() => {
        if (authPromiseResolverRef.current) {
          authPromiseResolverRef.current.reject(
            new Error('Apple authentication timed out'),
          );
          authPromiseResolverRef.current = null;

          WebBrowser.coolDownAsync()
            .then(() =>
              console.log(
                '[OktoClient] Browser cooled down after Apple auth timeout',
              ),
            )
            .catch((error) =>
              console.error('[OktoClient] Error cooling down browser:', error),
            );
        }
      }, 300000);

      WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
        showInRecents: true,
        createTask: false,
        preferEphemeralSession: true,
      })
        .then((result) => {
          clearTimeout(authTimeout);

          if (authPromiseResolverRef.current) {
            if (result.type === 'success') {
              try {
                if (result.url) {
                  // Apple returns authorization code and id_token in form_post
                  // We need to extract the id_token from the response
                  const urlObj = new URL(result.url);
                  const idToken = urlObj.searchParams.get('id_token');
                  if (idToken) {
                    authPromiseResolverRef.current.resolve(idToken);
                    authPromiseResolverRef.current = null;
                    return;
                  }
                }
              } catch (error) {
                console.error(
                  '[OktoClient] Error extracting Apple token from success URL:',
                  error,
                );
              }
            }
            if (result.type === 'dismiss') {
              if (authPromiseResolverRef.current) {
                authPromiseResolverRef.current.reject(
                  new Error('User canceled Apple authentication'),
                );
                authPromiseResolverRef.current = null;
              }
            }
          }
        })
        .catch((error) => {
          console.error('[OktoClient] Apple browser session error:', error);
          clearTimeout(authTimeout);

          if (authPromiseResolverRef.current) {
            authPromiseResolverRef.current.reject(error);
            authPromiseResolverRef.current = null;
          }
        });
    });
  };
}
