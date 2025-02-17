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
  private _clientPrivateKey: string;

  constructor(config: OktoClientConfig) {
    super(config);
    this._clientPrivateKey = config.clientPrivateKey;
    this.initializeSessionConfig();
  }

  private initializeSessionConfig(): void {
    const encryptedSession = getStorage('session');
    if (encryptedSession) {
      const sessionConfig = decryptData<SessionConfig>(
        encryptedSession,
        this._clientPrivateKey,
      );
      if (sessionConfig) {
        this.setSessionConfig(sessionConfig);
      }
    }
  }

  override loginUsingOAuth(
    data: AuthData,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data);
  }

  public setSession(
    sessionPrivateKey: `0x${string}`,
    sessionPublicKey: `0x${string}`,
    userSWA: `0x${string}`,
  ): void {
    const sessionConfig: SessionConfig = {
      sessionPrivKey: sessionPrivateKey,
      sessionPubKey: sessionPublicKey,
      userSWA: userSWA,
    };
    this.setSessionConfig(sessionConfig);
    setStorage('session', encryptData(sessionConfig, this._clientPrivateKey));
  }
}

export { OktoClient };
