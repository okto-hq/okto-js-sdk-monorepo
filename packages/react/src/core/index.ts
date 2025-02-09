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



class OktoClient extends OktoCoreClient {
  constructor(config: OktoClientConfig) {
    super(config);
  }

  override loginUsingOAuth(
    data: AuthData,
  ): Promise<Address | RpcError | undefined> {
    console.log('loginUsingOAuth called');
    return super.loginUsingOAuth(data, (session) => {
      localStorage.setItem('session', JSON.stringify(session));
    });
  }

  override getSessionConfig(): SessionConfig | undefined {
    const session = localStorage.getItem('session');
    if (session) {
      return JSON.parse(session);
    }
    return undefined;
  }
}

export { OktoClient };
