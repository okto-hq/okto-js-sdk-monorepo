import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type {
  Address,
  AuthData,
} from '@okto_web3/core-js-sdk/types';
import type  { SessionConfig } from '@okto_web3/core-js-sdk/core';
import { decryptData, encryptData } from 'src/utils/aes.js';
import * as asyncStorage from '@react-native-async-storage/async-storage';



class OktoClient extends OktoCoreClient {
  constructor(config: OktoClientConfig) {
    super(config);
  }
  

  override loginUsingOAuth(
    data: AuthData,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data, (session) => {
      const encryptedSession = encryptData(JSON.stringify(session), '');
      localStorage.setItem('session', encryptedSession);
    });
  }

  override getSessionConfig(): SessionConfig | undefined {
    const session = localStorage.getItem('session');
    if (session) {
      const decryptedSession = decryptData(session, '');
      return JSON.parse(decryptedSession);
    }
    return undefined;
  }

}

export { OktoClient };
