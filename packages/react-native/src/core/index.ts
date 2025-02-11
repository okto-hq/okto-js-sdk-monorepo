import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import { decryptData, encryptData } from '../utils/encryptionUtils.js';
import { MMKV } from 'react-native-mmkv';
class OktoClient extends OktoCoreClient {
  private _vendorPrivKey: string;
  private _storage: MMKV;

  constructor(config: OktoClientConfig) {
    super(config);
    this._vendorPrivKey = config.vendorPrivKey;
    this._storage = new MMKV();
  }

  override loginUsingOAuth(
    data: AuthData,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data, (session) => {
      this._storage.set('session', encryptData(session, this._vendorPrivKey));
    });
  }

  override getSessionConfig(): SessionConfig | undefined {
    const encryptedSession = this._storage.getString('session');
    const decryptedSession = encryptedSession
      ? decryptData<SessionConfig>(encryptedSession, this._vendorPrivKey)
      : undefined;
    return decryptedSession;
  }
}
export { OktoClient };
