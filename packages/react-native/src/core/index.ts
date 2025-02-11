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
    const storage = new MMKV();
    return super.loginUsingOAuth(data, (session) => {
      this._storage.set('session', encryptData(session, this._vendorPrivKey));
      console.log('Session set in storage:', storage.getString('session'));
    });
  }

  override getSessionConfig(): SessionConfig | undefined {
    const encryptedSession = this._storage.getString('session');
    console.log('Encrypted Session:', encryptedSession);
    const decryptedSession = encryptedSession
      ? decryptData<SessionConfig>(encryptedSession, this._vendorPrivKey)
      : undefined;
    console.log('Decrypted Session:', decryptedSession);
    return decryptedSession;
  }
}
export { OktoClient };
