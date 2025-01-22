import type {
  ApiResponse,
  ApiResponseWithCount,
} from '@/types/index.js';

import type {
  EstimateOrderPayload,
  NFTOrderDetails,
  Order,
  OrderEstimateResponse,
  UserNFTBalance,
  UserPortfolioActivity,
  UserPortfolioData,
  Wallet,
} from '@/types/bff/account.js';
import type { GetSupportedNetworksResponseData } from '@/types/bff/chains.js';
import type { UserSessionResponse } from '@/types/gateway/authenticate.js';
import { getBffClient } from './client.js';
import type { Token } from '@/types/bff/tokens.js';

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

    // POST
    estimateOrder: '/api/oc/v1/estimate',
    verifySession: '/api/oc/v1/verify-session',
  };

  /**
   * Retrieves the list of wallets for the authenticated user from the BFF service.
   *
   * @returns {Promise<Wallet[]>} A promise that resolves to an array of Wallet objects.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async getWallets(): Promise<Wallet[]> {
    const response = await getBffClient().get<ApiResponse<Wallet[]>>(
      this.routes.getWallets,
    );

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Retrieves the list of supported networks from the BFF service.
   *
   * @returns {Promise<GetSupportedNetworksResponseData[]>} A promise that resolves to an array of GetSupportedNetworksResponseData objects.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async getSupportedNetworks(): Promise<
    GetSupportedNetworksResponseData[]
  > {
    const response = await getBffClient().get<
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

  public static async verifySession(): Promise<UserSessionResponse> {
    const response = await getBffClient().post<
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
   *
   * @returns {Promise<Token[]>} A promise that resolves to an array of Token objects.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async getSupportedTokens(): Promise<Token[]> {
    const response = await getBffClient().get<
      ApiResponseWithCount<'tokens', Token>
    >(this.routes.getSupportedTokens);

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data.tokens;
  }

  /**
   * Retrieves the aggregated portfolio for the authenticated user from the BFF service.
   *
   * @returns {Promise<UserPortfolioData>} A promise that resolves to the aggregated portfolio data.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async getPortfolio(): Promise<UserPortfolioData> {
    const response = await getBffClient().get<ApiResponse<UserPortfolioData>>(
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
   *
   * @returns {Promise<UserPortfolioActivity[]>} A promise that resolves to an array of UserPortfolioActivity objects.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async getPortfolioActivity(): Promise<UserPortfolioActivity[]> {
    const response = await getBffClient().get<
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
   *
   * @returns {Promise<UserNFTBalance[]>} A promise that resolves to an array of UserNFTBalance objects.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async getPortfolioNft(): Promise<UserNFTBalance[]> {
    const response = await getBffClient().get<
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
   *
   * @returns {Promise<Order[]>} A promise that resolves to an array of Order objects.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async getOrders(): Promise<Order[]> {
    const response = await getBffClient().get<
      ApiResponseWithCount<'orders', Order>
    >(this.routes.getOrders);

    if (response.data.status === 'error') {
      throw new Error('Failed to retrieve orders');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data.orders;
  }

  /**
   * Retrieves the details of executed NFT orders from the backend.
   *
   * @returns {Promise<NFTOrderDetails[]>} A promise that resolves to an array of NFT order details.
   * @throws {Error} Throws an error if the response status is 'error' or if the response data is missing.
   */
  public static async getNftOrderDetails(): Promise<NFTOrderDetails[]> {
    const response = await getBffClient().get<
      ApiResponseWithCount<'executed', NFTOrderDetails>
    >(this.routes.getNftOrderDetails);

    if (response.data.status === 'error') {
      throw new Error('Failed to retrieve NFT order details');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data.executed;
  }

  public static async estimateOrder(
    payload: EstimateOrderPayload,
  ): Promise<OrderEstimateResponse> {
    const response = await getBffClient().get<
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
}

export default BffClientRepository;
