import type {
  ApiResponse,
  ApiResponseWithCount,
  Network,
  Token,
  Wallet,
} from '@/types/index.js';
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
    return response.data.data;
  }

  /**
   * Retrieves the list of supported networks from the BFF service.
   *
   * @returns {Promise<Network[]>} A promise that resolves to an array of Network objects.
   * @throws {Error} If the API request fails or returns an invalid response.
   */
  public static async getSupportedNetworks(): Promise<Network[]> {
    const response = await bffClient.get<
      ApiResponseWithCount<'network', Network>
    >(this.routes.getSupportedNetworks);
    return response.data.data.network;
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
    return response.data.data.tokens;
  }
}

export default BffClientRepository;
