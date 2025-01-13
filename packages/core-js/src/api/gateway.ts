import type { RpcPayload, RpcResponse } from '@/types/api.js';
import type { UserOp } from '@/types/core.js';
import type {
  AuthenticatePayloadParam,
  AuthenticateResult,
} from '@/types/gateway/authenticate.js';
import { gatewayClient } from './client.js';

class GatewayClientRepository {
  private static rpcRoute = '/rpc';

  private static methods = {
    authenticate: 'authenticate',
    execute: 'execute',
  };

  /**
   * Authenticates the user with the Gateway service.
   *
   * @returns {Promise<AuthenticateResult>} A promise that resolves to an AuthenticateResult object.
   * @throws {Error} If the API request fails or returns an invalid response.
   * @throws {Error} If the user is not authenticated.
   */
  public static async authenticate(
    data: AuthenticatePayloadParam,
  ): Promise<AuthenticateResult> {
    const payload: RpcPayload<AuthenticatePayloadParam[]> = {
      method: this.methods.authenticate,
      jsonrpc: '2.0',
      id: '1', //TODO: Generate UUID
      params: [data],
    };

    const response = await gatewayClient.post<RpcResponse<AuthenticateResult>>(
      this.rpcRoute,
      payload,
    );

    //TODO: Check if the user is authenticated and throw an error if not

    return response.data.result;
  }

  /**
   * Executes a user operation with the Gateway service.
   *
   * @returns {Promise<string>} A promise that resolves to a string.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async execute(data: UserOp): Promise<string> {
    const payload: RpcPayload<UserOp[]> = {
      method: this.methods.execute,
      jsonrpc: '2.0',
      id: '1', //TODO: Generate UUID
      params: [data],
    };

    const response = await gatewayClient.post<RpcResponse<string>>(
      this.rpcRoute,
      payload,
    );

    //TODO: Check if successful and throw an error if not

    return response.data.result;
  }
}

export default GatewayClientRepository;
