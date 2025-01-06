import type {
  ApiResponse,
  ApiResponseWithCount,
  Token,
  Wallet,
} from '@/types/index.js';
import type { GetSupportedNetworksResponseData ,UserSessionResponse,EstimateOrderPayload,OrderEstimateResponse} from '../types/bff.js';
import { bffClient } from './client.js';

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
    const response = await bffClient.get<ApiResponse<Wallet[]>>(
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
    const response = await bffClient.get<
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
    const response = await bffClient.post<ApiResponse<UserSessionResponse>>(
      this.routes.verifySession
    );
  
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
    const response = await bffClient.get<ApiResponseWithCount<'tokens', Token>>(
      this.routes.getSupportedTokens,
    );

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data.tokens;
  }

  public static async estimateOrder(payload: EstimateOrderPayload
  ): Promise<OrderEstimateResponse> {
    const response = await bffClient.post<ApiResponse<OrderEstimateResponse>>(
      this.routes.estimateOrder,
      payload
    );
  
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
