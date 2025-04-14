// src/core/OktoClient.ts
import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import { Routes, type AuthProvider } from 'src/webview/types.js';

class OktoClient extends OktoCoreClient {
  /**
   * Creates a new OktoClient instance
   * @param config - Configuration options for the Okto client
   */
  constructor(config: OktoClientConfig) {
    super(config);
    this.initializeSession();
  }

  /**
   * Initializes the client session from stored data
   * Retrieves the session from storage, sets session configuration,
   * and synchronizes user keys if a session exists
   */
  private initializeSession(): void {
    const session = getStorage('okto_session');
    if (session) {
      this.setSessionConfig(JSON.parse(session));
      this.syncUserKeys();
    }
  }

  /**
   * Overrides the parent's OAuth login method to persist session data
   * @param data - Authentication data for the OAuth login
   * @param onSuccess - Optional callback function called when login succeeds
   * @returns Promise resolving to user address, error, or undefined
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

  /**
   * Opens an authentication webview for user login
   * @param url - The URL to load in the webview
   * @param navigation - Navigation object used to navigate to the webview
   * @param options - Optional configuration including title, provider, and callbacks
   */
  public openAuthWebView = (
    url: string,
    navigation: any,
    options?: {
      title?: string;
      onAuthComplete?: (data: Record<string, any>) => void;
    },
  ): void => {
    navigation.navigate(Routes.AUTH_WEBVIEW, {
      url,
      ...options,
    });
  };

  /**
   * Overrides the parent's session clear method to also clear stored session data
   * Removes the session from local storage before calling the parent implementation
   */
  override sessionClear(): void {
    clearStorage('okto_session');
    return super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };
