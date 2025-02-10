import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import { decryptData, encryptData } from '../utils/encryptionUtils.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OktoClient extends OktoCoreClient {
  private _vendorPrivKey: string;

  constructor(config: OktoClientConfig) {
    super(config);
    this._vendorPrivKey = config.vendorPrivKey;
  }

  override async loginUsingOAuth(
    data: AuthData,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data, async (session) => {
      await AsyncStorage.default.setItem(
        'session',
        encryptData(session, this._vendorPrivKey),
      );
    });
  }

  override getSessionConfig(): SessionConfig | undefined {
    let sessionConfig: SessionConfig | undefined;

    AsyncStorage.default
      .getItem('session')
      .then((encryptedSession) => {
        if (encryptedSession) {
          sessionConfig = decryptData<SessionConfig>(
            encryptedSession,
            this._vendorPrivKey,
          );
        }
      })
      .catch((error) => {
        console.error('Failed to get session from storage:', error);
      });
    return sessionConfig;
  }
}
export { OktoClient };
