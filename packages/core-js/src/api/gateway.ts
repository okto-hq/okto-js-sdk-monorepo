import type OktoClient from '@/core/index.js';
import type { RpcPayload, RpcResponse } from '@/types/api.js';
import type { UserOp } from '@/types/core.js';
import type {
  AuthenticatePayloadParam,
  AuthenticateResult,
} from '@/types/gateway/authenticate.js';
import type { ExecuteResult } from '@/types/gateway/execute.js';
import type { getUserOperationGasPriceResult } from '@/types/gateway/g.js';
import type {
  GetUserKeysResult,
  SignMessageParams,
  SignMessageResult,
} from '@/types/gateway/signMessage.js';
import { generateUUID } from '@/utils/nonce.js';
import { serializeJSON } from '@/utils/serialize.js';
import { getGatewayClient } from './client.js';

class GatewayClientRepository {
  private static rpcRoute = '/rpc';

  private static methods = {
    authenticate: 'authenticate',
    execute: 'execute',
    GetUserKeys: 'getUserKeys',
    SignMessage: 'signMessage',
  };

  /**
   * Authenticates the user with the Gateway service.
   *
   * @returns {Promise<AuthenticateResult>} A promise that resolves to an AuthenticateResult object.
   * @throws {Error} If the API request fails or returns an invalid response.
   * @throws {Error} If the user is not authenticated.
   */
  public static async authenticate(
    oc: OktoClient,
    data: AuthenticatePayloadParam,
  ): Promise<AuthenticateResult> {
    const payload: RpcPayload<AuthenticatePayloadParam[]> = {
      method: this.methods.authenticate,
      jsonrpc: '2.0',
      id: generateUUID(),
      params: [data],
    };

    const serliazedPayload = serializeJSON(payload);

    const response = await getGatewayClient(oc).post<
      RpcResponse<AuthenticateResult>
    >(this.rpcRoute, serliazedPayload, {
      headers: {
        'Skip-Authorization': true,
      },
    });

    //TODO: Check if the user is authenticated and throw an error if not

    return response.data.result;
  }

  /**
   * Executes a user operation with the Gateway service.
   *
   * @returns {Promise<string>} A promise that resolves to a string.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async execute(oc: OktoClient, data: UserOp): Promise<string> {
    const payload: RpcPayload<UserOp[]> = {
      method: this.methods.execute,
      jsonrpc: '2.0',
      id: generateUUID(),
      params: [data],
    };

    const serliazedPayload = serializeJSON(payload);

    const response = await getGatewayClient(oc).post<
      RpcResponse<ExecuteResult>
    >(this.rpcRoute, serliazedPayload);

    //TODO: Check if successful and throw an error if not

    return response.data.result.jobId;
  }

  public static async GetUserKeys(oc: OktoClient): Promise<GetUserKeysResult> {
    const payload: RpcPayload<[]> = {
      method: this.methods.GetUserKeys,
      jsonrpc: '2.0',
      id: generateUUID(),
      params: [],
    };

    const serliazedPayload = serializeJSON(payload);

    const response = await getGatewayClient(oc).post<
      RpcResponse<GetUserKeysResult>
    >(this.rpcRoute, serliazedPayload);

    return response.data.result;
  }

  public static async SignMessage(
    oc: OktoClient,
    data: SignMessageParams,
  ): Promise<SignMessageResult> {
    const payload: RpcPayload<SignMessageParams[]> = {
      method: this.methods.SignMessage,
      jsonrpc: '2.0',
      id: generateUUID(),
      params: [data],
    };

    const serliazedPayload = serializeJSON(payload);

    const response = await getGatewayClient(oc).post<
      RpcResponse<SignMessageResult>
    >(this.rpcRoute, serliazedPayload);

    return response.data.result;
  }

  public static async getUserOperationGasPrice(
    oc: OktoClient,
  ): Promise<getUserOperationGasPriceResult> {
    const payload: RpcPayload<[]> = {
      method: 'getUserOperationGasPrice',
      jsonrpc: '2.0',
      id: generateUUID(),
      params: [],
    };

    const serliazedPayload = serializeJSON(payload);

    const response = await getGatewayClient(oc).post<
      RpcResponse<getUserOperationGasPriceResult>
    >(this.rpcRoute, serliazedPayload);

    return response.data.result;
  }
}

export default GatewayClientRepository;
