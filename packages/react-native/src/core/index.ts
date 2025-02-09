import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';
import type { SessionConfig } from '@okto_web3/core-js-sdk/core';
import { decryptData, encryptData } from 'src/utils/encryptionUtils.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OktoClient extends OktoCoreClient {
  constructor(config: OktoClientConfig) {
    super(config);
  }

  override async loginUsingOAuth(
    data: AuthData,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data, async (session) => {
      await AsyncStorage.default.setItem('session', encryptData(session));
    });
  }

  override getSessionConfig(): SessionConfig | undefined {
    let sessionConfig: SessionConfig | undefined;

    AsyncStorage.default
      .getItem('session')
      .then((encryptedSession) => {
        if (encryptedSession) {
          sessionConfig = decryptData<SessionConfig>(encryptedSession);
        }
      })
      .catch((error) => {
        console.error('Failed to get session from storage:', error);
      });
    return sessionConfig;
  }
}
export { OktoClient };
