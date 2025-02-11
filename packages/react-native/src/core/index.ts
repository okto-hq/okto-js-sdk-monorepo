import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import { decryptData, encryptData } from '../utils/encryptionUtils.js';
import * as Keychain from 'react-native-keychain';

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
      console.log('Session before encryption:', session);
      const encryptedSession = encryptData(session, this._vendorPrivKey);
      console.log('Encrypted session:', encryptedSession);

      Keychain.setGenericPassword('session', encryptedSession)
        .then(() => console.log('Session stored successfully'))
        .catch((error) =>
          console.error('Failed to store session in Keychain:', error),
        );
    });
  }

  override getSessionConfig(): SessionConfig | undefined {
    let sessionConfig: SessionConfig | undefined;

    Keychain.getGenericPassword()
      .then((credentials) => {
        if (credentials && credentials.password) {
          sessionConfig = decryptData<SessionConfig>(
            credentials.password,
            this._vendorPrivKey,
          );
        }
      })
      .catch((error) =>
        console.error('Failed to retrieve session from Keychain:', error),
      );

    return sessionConfig;
  }
}

export { OktoClient };
