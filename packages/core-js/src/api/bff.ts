import type {
  ApiResponse,
  ApiResponseWithCount,
  UserOp,
} from '@/types/index.js';

import type OktoClient from '@/core/index.js';
import type {
  EstimateGasLimitsPayload,
  EstimateGasLimitsResponse,
  EstimateOrderPayload,
  Order,
  OrderEstimateResponse,
  OrderFilterRequest,
  UserNFTBalance,
  UserPortfolioActivity,
  UserPortfolioData,
  Wallet,
} from '@/types/bff/account.js';
import type { GetSupportedNetworksResponseData } from '@/types/bff/chains.js';
import type { Token } from '@/types/bff/tokens.js';
import type {
  AuthenticatePayloadParam,
  AuthenticateResult,
  UserSessionResponse,
} from '@/types/gateway/authenticate.js';
import { getBffClient } from './client.js';
import type {
  GetUserKeysResult,
  SignMessageParams,
  SignMessageResult,
} from '@/types/gateway/signMessage.js';
import type { ExecuteResult } from '@/types/gateway/execute.js';
import type { getUserOperationGasPriceResult } from '@/types/gateway/g.js';

class BffClientRepository {
  private static routes = {
    // GET
    getWallets: '/api/oc/v1/wallets',
    getSupportedNetworks: '/api/oc/v1/supported/networks',
    getSupportedTokens: '/api/oc/v1/supported/tokens',
    getPortfolio: '/api/oc/v1/aggregated-portfolio',
    getPortfolioActivity: '/api/oc/v1/portfolio/activity',
    getPortfolioNft: '/api/oc/v1/portfolio/nft',
    getOrders: '/api/oc/v1/orders',
    getNftOrderDetails: '/api/oc/v1/nft/order-details',
    getUserKeys: '/api/oc/v1/user-keys',
    gasValues: '/api/oc/v1/gas-values',

    // POST
    estimateOrder: '/api/oc/v1/estimate',
    estimateGasLimits: '/api/oc/v1/estimate-userop',
    verifySession: '/api/oc/v1/verify-session',
    authenticate: '/api/oc/v1/authenticate',
    execute: '/api/oc/v1/execute',
    signMessage: '/api/oc/v1/signMessage',
  };

  /**
   * Retrieves the list of wallets for the authenticated user from the BFF service.
   */
  public static async getWallets(oc: OktoClient): Promise<Wallet[]> {
    const response = await getBffClient(oc).get<ApiResponse<Wallet[]>>(
      this.routes.getWallets,
    );

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Retrieves the list of supported networks from the BFF service.
   */
  public static async getSupportedNetworks(
    oc: OktoClient,
  ): Promise<GetSupportedNetworksResponseData[]> {
    const response = await getBffClient(oc).get<
      ApiResponseWithCount<'network', GetSupportedNetworksResponseData>
    >(this.routes.getSupportedNetworks);

    if (response.data.status === 'error') {
      throw new Error('Failed to retrieve supported networks');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data.network;
  }

  public static async verifySession(
    oc: OktoClient,
  ): Promise<UserSessionResponse> {
    const response = await getBffClient(oc).get<
      ApiResponse<UserSessionResponse>
    >(this.routes.verifySession);

    if (response.data.status === 'error') {
      throw new Error('Failed to verify user session');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Retrieves the list of supported tokens from the BFF service.
   */
  public static async getSupportedTokens(oc: OktoClient): Promise<Token[]> {
    const response = await getBffClient(oc).get<
      ApiResponseWithCount<'tokens', Token>
    >(this.routes.getSupportedTokens);

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data.tokens;
  }

  /**
   * Retrieves the aggregated portfolio for the authenticated user from the BFF service.
   */
  public static async getPortfolio(oc: OktoClient): Promise<UserPortfolioData> {
    const response = await getBffClient(oc).get<ApiResponse<UserPortfolioData>>(
      this.routes.getPortfolio,
    );

    if (response.data.status === 'error') {
      throw new Error('Failed to retrieve portfolio');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Retrieves the portfolio activity for the authenticated user from the BFF service.
   */
  public static async getPortfolioActivity(
    oc: OktoClient,
  ): Promise<UserPortfolioActivity[]> {
    const response = await getBffClient(oc).get<
      ApiResponseWithCount<'activity', UserPortfolioActivity>
    >(this.routes.getPortfolioActivity);

    if (response.data.status === 'error') {
      throw new Error('Failed to retrieve portfolio activity');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data.activity;
  }

  /**
   * Retrieves the NFT portfolio for the authenticated user from the BFF service.
   */
  public static async getPortfolioNft(
    oc: OktoClient,
  ): Promise<UserNFTBalance[]> {
    const response = await getBffClient(oc).get<
      ApiResponseWithCount<'details', UserNFTBalance>
    >(this.routes.getPortfolioNft);

    if (response.data.status === 'error') {
      throw new Error('Failed to retrieve NFT portfolio');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data.details;
  }

  /**
   * Retrieves the list of orders for the authenticated user from the BFF service.
   */
  /**
   * Retrieves the list of orders for the authenticated user from the BFF service.
   */
  public static async getOrders(
    oc: OktoClient,
    filters?: OrderFilterRequest,
  ): Promise<Order[]> {
    const response = await getBffClient(oc).get<
      ApiResponseWithCount<'items', Order>
    >(this.routes.getOrders, {
      params: {
        intent_id: filters?.intentId,
        status: filters?.status,
        intent_type: filters?.intentType,
      },
    });

    if (response.data.status === 'error') {
      throw new Error('Failed to retrieve orders: ' + response.data.error);
    }

    if (!response.data.data?.items) {
      throw new Error('No orders found or response data is missing.');
    }

    return response.data.data.items;
  }
  /**
   * Retrieves the details of executed NFT orders from the backend.
   */
  public static async getNftOrderDetails(oc: OktoClient): Promise<Order[]> {
    return await this.getOrders(oc, { intentType: 'NFT_TRANSFER' });
  }

  /**
   * Estimates the gas limits for a user operation.
   */
  public static async estimateGasLimits(
    oc: OktoClient,
    payload: EstimateGasLimitsPayload,
  ): Promise<EstimateGasLimitsResponse> {
    const response = await getBffClient(oc).post<
      ApiResponse<EstimateGasLimitsResponse>
    >(this.routes.estimateGasLimits, payload);

    if (response.data.status === 'error') {
      throw new Error(
        'Failed to estimate user operation: ' + response.data.error?.message,
      );
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  public static async estimateOrder(
    oc: OktoClient,
    payload: EstimateOrderPayload,
  ): Promise<OrderEstimateResponse> {
    const response = await getBffClient(oc).get<
      ApiResponse<OrderEstimateResponse>
    >(this.routes.estimateOrder, {
      data: payload,
    });

    if (response.data.status === 'error') {
      throw new Error('Failed to estimate order');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }
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

export default BffClientRepository;
