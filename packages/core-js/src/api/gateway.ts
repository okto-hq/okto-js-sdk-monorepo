import type { RpcPayload, RpcResponse } from '@/types/api.js';
import type {
  AuthenticatePayloadParams,
  AuthenticateResult,
} from '@/types/authenticate.js';
import { gatewayClient } from './client.js';

class GatewayClientRepository {
  private static rpcRoute = '/rpc';

  /**
   * Authenticates the user with the Gateway service.
   *
   * @returns {Promise<AuthenticateResult>} A promise that resolves to an AuthenticateResult object.
   * @throws {Error} If the API request fails or returns an invalid response.
   * @throws {Error} If the user is not authenticated.
   */
  public static async authenticate(): Promise<AuthenticateResult> {
    const payload: RpcPayload<AuthenticatePayloadParams[]> = {
      method: 'authenticate',
      jsonrpc: '2.0',
      id: '1', //TODO: Generate UUID
      params: [],
    };

    const response = await gatewayClient.post<RpcResponse<AuthenticateResult>>(
      this.rpcRoute,
      payload,
    );

    //TODO: Check if the user is authenticated and throw an error if not

    return response.data.result;
  }
}

export default GatewayClientRepository;
