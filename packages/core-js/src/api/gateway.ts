import type OktoClient from '@/core/index.js';
import type { ApiResponse } from '@/types/api.js';
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
import { getBffClient } from './client.js';

class GatewayClientRepository {
  private static routes = {
    // POST
    authenticate: '/api/oc/v1/authenticate',
    execute: '/api/oc/v1/execute',
    signMessage: '/api/oc/v1/signMessage',

    // GET
    getUserKeys: '/api/oc/v1/user-keys',
    gasValues: '/api/oc/v1/gas-values',
  };

  /**
   * Authenticates the user with the Gateway service using BFF API.
   *
   * @returns {Promise<AuthenticateResult>} A promise that resolves to an AuthenticateResult object.
   * @throws {Error} If the API request fails or returns an invalid response.
   * @throws {Error} If the user is not authenticated.
   */
  public static async authenticate(
    oc: OktoClient,
    data: AuthenticatePayloadParam,
  ): Promise<AuthenticateResult> {
    const response = await getBffClient(oc).post<
      ApiResponse<AuthenticateResult>
    >(this.routes.authenticate, data, {
      headers: {
        'Skip-Authorization': true,
      },
    });

    if (response.data.status === 'error') {
      throw new Error('Authentication failed: ' + response.data.error);
    }

    if (!response.data.data) {
      throw new Error('Authentication response data is missing');
    }

    return response.data.data;
  }

  /**
   * Executes a user operation with the Gateway service using BFF API.
   *
   * @returns {Promise<string>} A promise that resolves to a job ID string.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async execute(oc: OktoClient, data: UserOp): Promise<string> {
    const response = await getBffClient(oc).post<ApiResponse<ExecuteResult>>(
      this.routes.execute,
      data,
    );

    if (response.data.status === 'error') {
      throw new Error('Execute operation failed: ' + response.data.error);
    }

    if (!response.data.data) {
      throw new Error('Execute response data is missing');
    }

    return response.data.data.jobId;
  }

  /**
   * Retrieves user keys from the Gateway service using BFF API.
   *
   * @returns {Promise<GetUserKeysResult>} A promise that resolves to user keys data.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async GetUserKeys(oc: OktoClient): Promise<GetUserKeysResult> {
    const response = await getBffClient(oc).get<ApiResponse<GetUserKeysResult>>(
      this.routes.getUserKeys,
    );

    if (response.data.status === 'error') {
      throw new Error('Failed to retrieve user keys: ' + response.data.error);
    }

    if (!response.data.data) {
      throw new Error('User keys response data is missing');
    }

    return response.data.data;
  }

  /**
   * Signs a message using the Gateway service BFF API.
   *
   * @returns {Promise<SignMessageResult>} A promise that resolves to signed message data.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async SignMessage(
    oc: OktoClient,
    data: SignMessageParams,
  ): Promise<SignMessageResult> {
    const response = await getBffClient(oc).post<
      ApiResponse<SignMessageResult>
    >(this.routes.signMessage, data);

    if (response.data.status === 'error') {
      throw new Error('Failed to sign message: ' + response.data.error);
    }

    if (!response.data.data) {
      throw new Error('Sign message response data is missing');
    }

    return response.data.data;
  }

  /**
   * Retrieves user operation gas price from the Gateway service using BFF API.
   *
   * @returns {Promise<getUserOperationGasPriceResult>} A promise that resolves to gas price data.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async getUserOperationGasPrice(
    oc: OktoClient,
  ): Promise<getUserOperationGasPriceResult> {
    const response = await getBffClient(oc).get<
      ApiResponse<getUserOperationGasPriceResult>
    >(this.routes.gasValues);

    if (response.data.status === 'error') {
      throw new Error('Failed to retrieve gas values: ' + response.data.error);
    }

    if (!response.data.data) {
      throw new Error('Gas values response data is missing');
    }

    return response.data.data;
  }
}

export default GatewayClientRepository;
