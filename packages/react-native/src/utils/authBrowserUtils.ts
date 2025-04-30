import * as WebBrowser from 'expo-web-browser';

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
      console.warn('Existing auth session detected, clearing previous session');
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
              console.log('[OktoClient] Browser cooled down after timeout'),
            )
            .catch((error) =>
              console.error('[OktoClient] Error cooling down browser:', error),
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
                console.error(
                  '[OktoClient] Error extracting token from success URL:',
                  error,
                );
              }
            }
            if (result.type === 'dismiss') {
              if (authPromiseResolverRef.current) {
                authPromiseResolverRef.current.reject(
                  new Error('User canceled authentication'),
                );
                authPromiseResolverRef.current = null;
              }
            }
          } else {
            console.log(
              '[OktoClient] No active promise resolver - auth may have completed via deep link',
            );
          }
        })
        .catch((error) => {
          console.error('[OktoClient] Browser session error:', error);
          clearTimeout(authTimeout);

          if (authPromiseResolverRef.current) {
            authPromiseResolverRef.current.reject(error);
            authPromiseResolverRef.current = null;
          }
        });
    });
  };
}
