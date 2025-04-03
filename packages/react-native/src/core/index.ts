// src/core/OktoClient.ts
import { OktoClient as OktoCoreClient, type OktoClientConfig } from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import { clearStorage, getStorage, setStorage } from '../utils/storageUtils.js';
import webViewAuth from '../utils/webViewUtils.js';

class OktoClient extends OktoCoreClient {
  constructor(config: OktoClientConfig) {
    super(config);
    this.initializeSession();
  }

  private initializeSession(): void {
    const session = getStorage('okto_session');
    if (session) {
      this.setSessionConfig(JSON.parse(session));
      this.syncUserKeys();
    }
  }

  // Authentication via WebView
  async authenticateViaWebView(
    options: {
      providerTypes?: string[];
      callbackUrl?: string;
      onSuccess?: (session: SessionConfig) => void;
      onError?: (error: Error) => void;
      onCancel?: () => void;
    } = {}
  ): Promise<void> {
    const { providerTypes = ['all'], callbackUrl, onSuccess, onError, onCancel } = options;
    
    try {
      // Generate a unique message ID
      const messageId = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Build the auth URL - use instance method instead of static
      const authUrl = webViewAuth.buildAuthUrl({
        messageId,
        providerTypes,
        callbackUrl,
        apiKey: "",
        environment: "staging",
      });
      
      // Launch the auth flow
      webViewAuth.launchAuthFlow({
        authUrl,
        messageId,
        onSuccess: (authData) => {
          this.loginUsingOAuth(authData, onSuccess)
            .catch(err => onError?.(err));
        },
        onError,
        onCancel
      });
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
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

  override sessionClear(): void {
    clearStorage('okto_session');
    return super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };
