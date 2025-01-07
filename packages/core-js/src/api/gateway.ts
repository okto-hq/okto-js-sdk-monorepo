import { v4 as uuidv4 } from 'uuid';
import type { RpcPayload, RpcResponse } from '@/types/api.js';
import type {
  AuthenticatePayloadParam,
  AuthenticateResult,
} from '@/types/gateway/authenticate.js';
import { gatewayClient } from './client.js';
import type{ WhitelistedToken, WhitelistedCollection } from '@/types/gateway/token.js'

class GatewayClientRepository {
  private static rpcRoute = '/rpc';

  private static methods = {
    authenticate: 'authenticate',
    execute: 'execute',
    getWhitelistedTokens: 'getWhitelistedTokens',
    getWhitelistedCollections: 'getWhitelistedCollections',
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

  public static async getWhitelistedTokens(): Promise<WhitelistedToken[]> {
    const payload: RpcPayload<[]> = {
      method: this.methods.getWhitelistedTokens,
      jsonrpc: '2.0',
      id: uuidv4(),
      params: [],
    };

    const response = await gatewayClient.post<RpcResponse<WhitelistedToken[]>>(
      this.rpcRoute,
      payload,
    );

    return response.data.result;
  }

  public static async getWhitelistedCollections(): Promise<WhitelistedCollection[]> {
    const payload: RpcPayload<[]> = {
      method: this.methods.getWhitelistedCollections,
      jsonrpc: '2.0',
      id: uuidv4(),
      params: [], //check with params once
    };
    const response = await gatewayClient.post<RpcResponse<WhitelistedCollection[]>>(
      this.rpcRoute,
      payload,
    );

    return response.data.result;
  }
}

export default GatewayClientRepository;
