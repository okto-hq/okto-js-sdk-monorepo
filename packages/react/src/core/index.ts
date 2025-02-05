import {
  OktoClient as OktoCoreClient,
  type OktoClientConfig,
} from '@okto_web3/core-js-sdk';
import type { RpcError } from '@okto_web3/core-js-sdk/errors';
import type { Address, AuthData } from '@okto_web3/core-js-sdk/types';

class OktoClient extends OktoCoreClient {
  constructor(config: OktoClientConfig) {
    super(config);
  }

  override loginUsingOAuth(
    data: AuthData,
  ): Promise<Address | RpcError | undefined> {
    return super.loginUsingOAuth(data, (session) => {
      //TODO: Encrypt the session and store it in the local storage
      localStorage.setItem('session', JSON.stringify(session));
    });
  }
}

export { OktoClient };
