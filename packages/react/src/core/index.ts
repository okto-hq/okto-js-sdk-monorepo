import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import {
  clearLocalStorage,
  getLocalStorage,
  setLocalStorage,
} from 'src/utils/storageUtils.js';

class OktoClient extends OktoCoreClient {
  constructor(config: OktoClientConfig) {
    super(config);
    this.initializeSession();
  }

  private async initializeSession(): Promise<void> {
    const session = await getLocalStorage('okto_session');
    if (session) {
      this.setSessionConfig(JSON.parse(session));
      this.syncUserKeys();
    }
  }

  override loginUsingOAuth(
    data: AuthData,
    onSuccess?: (session: SessionConfig) => void,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data, (session) => {
      setLocalStorage('okto_session', JSON.stringify(session));
      this.setSessionConfig(session);
      onSuccess?.(session);
    });
  }

  override sessionClear(): void {
    clearLocalStorage('okto_session');
    return super.sessionClear();
  }
}

export { OktoClient };
export type { OktoClientConfig };
