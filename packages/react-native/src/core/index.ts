// src/core/OktoClient.ts
import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import { decryptData, encryptData } from '../utils/encryptionUtils.js';
import { setStorage, getStorage } from '../utils/storageUtils.js';

class OktoClient extends OktoCoreClient {
  private _vendorPrivKey: string;

  constructor(config: OktoClientConfig) {
    super(config);
    this._vendorPrivKey = config.vendorPrivKey;
    this.initializeSessionConfig();
  }

  private initializeSessionConfig(): void {
    const encryptedSession = getStorage('session');
    if (encryptedSession) {
      const sessionConfig = decryptData<SessionConfig>(
        encryptedSession,
        this._vendorPrivKey,
      );
      if (sessionConfig) {
        this.setSessionConfig(sessionConfig);
      }
    }
  }

  override loginUsingOAuth(
    data: AuthData,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data, (session) => {
      setStorage('session', encryptData(session, this._vendorPrivKey));
      this.setSessionConfig(session);
    });
  }
}

export { OktoClient };
