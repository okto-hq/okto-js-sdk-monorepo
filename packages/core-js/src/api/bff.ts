import type {
  ApiResponse,
  ApiResponseWithCount,
  UserOp,
  SupportedRampTokensResponse,
  TransactionTokenResponse,
} from '@/types/index.js';

import type OktoClient from '@/core/index.js';
import type {
  EstimateGasLimitsPayload,
  EstimateGasLimitsResponse,
  EstimateOrderPayload,
  Order,
  OrderFilterRequest,
  ReadContractPayload,
  ReadContractResponse,
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
import type {
  TokenTransferEstimateRequest,
  TokenTransferEstimateResponse,
  NFTTransferEstimateRequest,
  NFTTransferEstimateResponse,
  AptosRawTransactionEstimateRequest,
  AptosRawTransactionEstimateResponse,
  EvmRawTransactionEstimateResponse,
  EvmRawTransactionEstimateRequest,
  NftMintEstimateRequest,
  NftMintEstimateResponse,
  NftCreateCollectionEstimateRequest,
  NftCreateCollectionEstimateResponse,
  SwapEstimateRequest,
  SwapEstimateResponse,
} from '@/types/bff/estimate.js';

class BffClientRepository {
  private static routes = {
    // GET
    getWallets: '/api/oc/v1/wallets',
    getSupportedNetworks: '/api/oc/v1/supported/networks',
    getSupportedTokens: '/api/oc/v1/supported/tokens',
    getPortfolio: '/api/oc/v2/aggregated-portfolio',
    getPortfolioForSwap: '/api/oc/v1/user-unfiltered-portfolio',
    getPortfolioActivity: '/api/oc/v1/portfolio/activity',
    getPortfolioNft: '/api/oc/v1/portfolio/nft',
    getOrders: '/api/oc/v1/orders',
    getNftOrderDetails: '/api/oc/v1/nft/order-details',
    getUserKeys: '/api/oc/v1/user-keys',
    gasValues: '/api/oc/v1/gas-values',
    getEntities: '/api/oc/v1/entities',
    getSupportedRampTokens: '/api/v2/supported_ramp_tokens',

    // POST
    estimateOrder: '/api/oc/v1/estimate',
    estimateGasLimits: '/api/oc/v1/estimate-userop',
    verifySession: '/api/oc/v1/verify-session',
    authenticate: '/api/oc/v1/authenticate',
    execute: '/api/oc/v1/execute',
    signMessage: '/api/oc/v1/signMessage',
    rawRead: '/api/oc/v1/readContractData',
    generateTransactionToken: '/api/v2/transaction_token',
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
   * Retrieves the aggregated portfolio for the Swap with non-whitelisted Tokens.
   */
  public static async getPortfolioForSwap(
    oc: OktoClient,
  ): Promise<UserPortfolioData> {
    const response = await getBffClient(oc).get<ApiResponse<UserPortfolioData>>(
      this.routes.getPortfolioForSwap,
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
    const response = await getBffClient(oc).post<
      ApiResponse<SwapEstimateResponse>
    >(this.routes.estimateOrder, requestBody);

    if (response.data.status === 'error') {
      throw new Error('Failed to estimate token transfer');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Gets the NFT transfer estimate from the BFF API.
   *
   * @param oc - The OktoClient instance.
   * @param requestBody - The NFT transfer estimate request parameters.
   * @returns The NFT transfer estimate response.
   */
  public static async getTokenTransferEstimate(
    oc: OktoClient,
    requestBody: TokenTransferEstimateRequest,
  ): Promise<TokenTransferEstimateResponse> {
    const response = await getBffClient(oc).post<
      ApiResponse<TokenTransferEstimateResponse>
    >(this.routes.estimateOrder, requestBody);

    if (response.data.status === 'error') {
      throw new Error('Failed to estimate NFT transfer');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Gets the NFT transfer estimate from the BFF API.
   *
   * @param oc - The OktoClient instance.
   * @param requestBody - The NFT transfer estimate request parameters.
   * @returns The NFT transfer estimate response.
   */
  public static async getNFTTransferEstimate(
    oc: OktoClient,
    requestBody: NFTTransferEstimateRequest,
  ): Promise<NFTTransferEstimateResponse> {
    const response = await getBffClient(oc).post<
      ApiResponse<NFTTransferEstimateResponse>
    >(this.routes.estimateOrder, requestBody);

    if (response.data.status === 'error') {
      throw new Error('Failed to estimate NFT transfer');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Gets a EVM raw transaction estimate from the BFF API.
   *
   * @param oc - The OktoClient instance
   * @param requestBody - The EVM raw transaction estimate request
   * @returns The raw transaction estimate response
   * @throws Error if the estimate fails or response is missing
   */
  public static async getEvmRawTransactionEstimate(
    oc: OktoClient,
    requestBody: EvmRawTransactionEstimateRequest,
  ): Promise<EvmRawTransactionEstimateResponse> {
    const response = await getBffClient(oc).post<
      ApiResponse<EvmRawTransactionEstimateResponse>
    >(this.routes.estimateOrder, requestBody);

    if (response.data.status === 'error') {
      throw new Error('Failed to estimate raw transaction');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Gets a Aptos raw transaction estimate from the BFF API.
   *
   * @param oc - The OktoClient instance
   * @param requestBody - The Aptos raw transaction estimate request
   * @returns The raw transaction estimate response
   * @throws Error if the estimate fails or response is missing
   */

  public static async getAptosRawTransactionEstimate(
    oc: OktoClient,
    requestBody: AptosRawTransactionEstimateRequest,
  ): Promise<AptosRawTransactionEstimateResponse> {
    const response = await getBffClient(oc).post<
      ApiResponse<AptosRawTransactionEstimateResponse>
    >(this.routes.estimateOrder, requestBody);

    if (response.data.status === 'error') {
      throw new Error('Failed to estimate Aptos raw transaction');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Gets a NFT Mint estimate from the BFF API.
   *
   * @param oc - The OktoClient instance
   * @param requestBody - The NFT Mint estimate request
   * @returns The raw transaction estimate response
   * @throws Error if the estimate fails or response is missing
   */

  public static async getNftMintEstimate(
    oc: OktoClient,
    requestBody: NftMintEstimateRequest,
  ): Promise<NftMintEstimateResponse> {
    const response = await getBffClient(oc).post<
      ApiResponse<NftMintEstimateResponse>
    >(this.routes.estimateOrder, requestBody);

    if (response.data.status === 'error') {
      throw new Error('Failed to estimate NFT mint');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Gets an estimate for NFT collection creation.
   *
   * This function provides an estimation of fees and other details for creating
   * an NFT collection on the blockchain.
   *
   * @param oc - The OktoClient instance used to interact with the blockchain.
   * @param requestBody - The request containing NFT collection details and other parameters.
   * @returns A promise resolving to the estimation response with details and userOp.
   * @throws Error if the estimation fails or response data is missing.
   */

  public static async getNftCreateCollectionEstimate(
    oc: OktoClient,
    requestBody: NftCreateCollectionEstimateRequest,
  ): Promise<NftCreateCollectionEstimateResponse> {
    const response = await getBffClient(oc).post<
      ApiResponse<NftCreateCollectionEstimateResponse>
    >(this.routes.estimateOrder, requestBody);

    if (response.data.status === 'error') {
      throw new Error('Failed to estimate NFT collection creation');
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

  /**
   * Reads data from a smart contract using the BFF API.
   *
   * @param oc - The OktoClient instance.
   * @param requestBody - The updated request body containing advanced contract read parameters.
   * @returns ReadContractResponse the contract read response.
   * @throws Error if the read fails or throws error.
   */
  public static async rawRead(
    oc: OktoClient,
    requestBody: ReadContractPayload,
  ): Promise<ReadContractResponse | undefined> {
    const response = await getBffClient(oc).post<
      ApiResponse<ReadContractResponse>
    >(this.routes.rawRead, requestBody);

    if (response.data.status === 'error') {
      throw new Error('Failed to read contract data');
    }

    return response.data.data;
  }

  /**
   * Retrieves the list of supported ramp tokens from the BFF service.
   * @param oc OktoClient instance
   * @param countryCode Country code to filter tokens (e.g., 'IN')
   * @param side Transaction side ('onramp' or 'offramp')
   * @returns SupportedRampTokensResponse containing onramp and offramp tokens
   */
  public static async getSupportedRampTokens(
    oc: OktoClient,
    countryCode: string,
    side: 'onramp' | 'offramp',
  ): Promise<SupportedRampTokensResponse> {
    const response = await getBffClient(oc).get<
      ApiResponse<SupportedRampTokensResponse>
    >(this.routes.getSupportedRampTokens, {
      params: {
        country_code: countryCode,
        side,
      },
    });

    if (response.data.status === 'error') {
      throw new Error(
        `Failed to retrieve supported ramp tokens: ${response.data.error?.message || 'Unknown error'}`,
      );
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  /**
   * Generates a transaction token used for ramp operations.
   * @param oc OktoClient instance
   * @returns The transaction token
   */
  public static async generateTransactionToken(
    oc: OktoClient,
  ): Promise<string> {
    const response = await getBffClient(oc).post<
      ApiResponse<TransactionTokenResponse>
    >(
      this.routes.generateTransactionToken,
      {},
      {
        headers: {
          'x-source': 'okto_wallet_web',
          'x-version': 'okto_plus',
        },
      },
    );

    if (response.data.status === 'error') {
      throw new Error(
        `Failed to generate transaction token: ${response.data.error?.message || 'Unknown error'}`,
      );
    }

    if (!response.data.data || !response.data.data.transactionToken) {
      throw new Error('Transaction token is missing in the response');
    }

    return response.data.data.transactionToken;
  }
}

export default BffClientRepository;
