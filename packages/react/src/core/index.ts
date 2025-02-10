import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import { encryptData, decryptData } from '../utils/encryptionUtils.js';

class OktoClient extends OktoCoreClient {
  private _vendorPrivKey: string;

  constructor(config: OktoClientConfig) {
    super(config);
    this._vendorPrivKey = config.vendorPrivKey;
  }

  override loginUsingOAuth(
    data: AuthData,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data, (session) => {
      localStorage.setItem('session', encryptData(session,this._vendorPrivKey));
    });
  }

  override getSessionConfig(): SessionConfig | undefined {
    const encryptedSession = localStorage.getItem('session');
    return encryptedSession
      ? decryptData<SessionConfig>(encryptedSession,this._vendorPrivKey)
      : undefined;
  }
}

export { OktoClient };
