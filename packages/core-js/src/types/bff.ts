// Get type of response data

export type GetSupportedNetworksResponseData = {
  caipId: string;
  networkName: string;
  chainId: string;
  logo: string;
};

/**
 * Represents the user portfolio data.
 */
export type UserPortfolioData = {
  /**
   * Aggregated data of the user's holdings.
   */
  aggregatedData: {
    holdingsCount: string;
    holdingsPriceInr: string;
    holdingsPriceUsdt: string;
    totalHoldingPriceInr: string;
    totalHoldingPriceUsdt: string;
  };
  /**
   * Array of group tokens.
   */
  groupTokens: Array<{
    id: string;
    name: string;
    symbol: string;
    shortName: string;
    tokenImage: string;
    tokenAddress: string;
    groupId: string;
    networkId: string;
    precision: string;
    networkName: string;
    isPrimary: boolean;
    balance: string;
    holdingsPriceUsdt: string;
    holdingsPriceInr: string;
    aggregationType: string;
    /**
     * Array of tokens within the group.
     */
    tokens: Array<{
      id: string;
      name: string;
      symbol: string;
      shortName: string;
      tokenImage: string;
      tokenAddress: string;
      networkId: string;
      precision: string;
      networkName: string;
      isPrimary: boolean;
      balance: string;
      holdingsPriceUsdt: string;
      holdingsPriceInr: string;
    }>;
  }>;
};

/**
 * Represents a user's portfolio activity.
 */
export type UserPortfolioActivity = {
  symbol: string;
  image: string;
  name: string;
  shortName: string;
  id: string;
  groupId: string;
  description: string;
  quantity: string;
  orderType: string;
  transferType: string;
  status: string;
  timestamp: number;
  txHash: string;
  networkId: string;
  networkName: string;
  networkExplorerUrl: string;
  networkSymbol: string;
  caipId: string;
};

/**
 * Represents a user's NFT balance.
 */
export type UserNFTBalance = {
  collectionId: string;
  networkId: string;
  caipId: string;
  networkName: string;
  entityType: string;
  collectionAddress: string;
  collectionName: string;
  nftId: string;
  image: string;
  quantity: string;
  tokenUri: string;
  description: string;
  nftName: string;
  explorerSmartContractUrl: string;
  collectionImage: string;
};


/**
 * Represents an order.
 */
export type Order = {
  downstreamTransactionHash: string[];
  transactionHash: string;
  status: string;
  intentId: string;
  intentType: string;
  networkName: string;
  caipId: string;
  details: {
    recipientWalletAddress: string;
    networkId: string;
    tokenAddress: string;
    amount: string;
  };
};

/**
 * Represents the details of an NFT order.
 */
export type NFTOrderDetails = {
  jobId: string;
  status: string;
  orderType: string;
  networkId: string;
  createdAt: string;
  updatedAt: string;
};