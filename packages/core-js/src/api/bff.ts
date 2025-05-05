import type { ApiResponse, ApiResponseWithCount } from '@/types/index.js';

import type OktoClient from '@/core/index.js';
import type {
  Order,
  OrderFilterRequest,
  UserNFTBalance,
  UserPortfolioActivity,
  UserPortfolioData,
  Wallet,
} from '@/types/bff/account.js';
import type { GetSupportedNetworksResponseData } from '@/types/bff/chains.js';
import type {
  Token,
  TokenEntity,
  TokenListingFilter,
  TokenListingParams,
} from '@/types/bff/tokens.js';
import type { UserSessionResponse } from '@/types/gateway/authenticate.js';
import { getBffClient } from './client.js';
import type {
  SwapEstimateRequest,
  SwapEstimateResponse,
} from '@/types/bff/swap.js';
import { serializeJSON } from '@/utils/serialize.js';
import axios from 'axios';

class BffClientRepository {
  private static routes = {
    // GET
    getWallets: '/api/oc/v1/wallets',
    getSupportedNetworks: '/api/oc/v1/supported/networks',
    getSupportedTokens: '/api/oc/v1/supported/tokens',
    getPortfolio: '/api/oc/v2/aggregated-portfolio',
    getPortfolioActivity: '/api/oc/v1/portfolio/activity',
    getPortfolioNft: '/api/oc/v1/portfolio/nft',
    getOrders: '/api/oc/v1/orders',
    getNftOrderDetails: '/api/oc/v1/nft/order-details',
    getEntities: '/api/oc/v1/entities',
    getSwapEstimate: '/api/oc/v1/estimate',

    // POST
    estimateOrder: '/api/oc/v1/estimate',
    verifySession: '/api/oc/v1/verify-session',
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
   * Retrieves tokens for swap based on different listing criteria
   * @param oc OktoClient instance
   * @param options Listing options (discovery, network filter, or search)
   * @returns Promise with array of TokenEntity objects
   */
  public static async getTokensForSwap(
    oc: OktoClient,
    filters: TokenListingFilter,
  ): Promise<TokenEntity[]> {
    const params: TokenListingParams = {
      identifier: '',
    };

    switch (filters.type) {
      case 'discovery':
        params.identifier = 'active_tradable_tokens_v1';
        break;
      case 'network_filter':
        if (!filters.networks || filters.networks.length === 0) {
          throw new Error('Networks must be provided for network filter type');
        }
        params.identifier = 'active_tradable_tokens_by_caip2_ids_v1';
        params.caip2_ids = filters.networks;
        break;
      case 'search':
        if (!filters.searchText) {
          throw new Error('Search text must be provided for search type');
        }
        params.identifier = 'searchable_tokens_v1';
        params.searchText = filters.searchText;
        break;
      default:
        throw new Error('Invalid listing type specified');
    }
    const response = await getBffClient(oc).get<
      ApiResponse<{ entities: TokenEntity[] }>
    >(this.routes.getEntities, { params });

    if (response.data.status === 'error') {
      throw new Error(
        `Failed to retrieve tokens: ${response.data.error?.message || 'Unknown error'}`,
      );
    }

    if (!response.data.data || !response.data.data.entities) {
      throw new Error('Response data is missing');
    }

    return response.data.data.entities;
  }

  public static async getSwapEstimate(
    oc: OktoClient,
    requestBody: SwapEstimateRequest,
  ): Promise<SwapEstimateResponse> {
    const response = await axios.request<
      ApiResponse<SwapEstimateResponse>
    >({
      method: 'GET',
      url: this.routes.getSwapEstimate,
      data: requestBody,
      baseURL: oc.env.bffBaseUrl,
      headers:{
        'Authorization': `Bearer ${await oc.getAuthorizationToken()}`,
        'Content-Type': 'application/json',
      }
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
