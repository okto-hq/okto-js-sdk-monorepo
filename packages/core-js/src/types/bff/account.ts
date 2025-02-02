import type { Hash } from '../core.js';

/**
 * ========================
 * Wallet Types
 * ========================
 */

/**
 * Represents a wallet.
 */
export type Wallet = {
  caipId: string;
  networkName: string;
  address: string;
  networkId: string;
  networkSymbol: string;
};

/**
 * ========================
 * Portfolio Types
 * ========================
 */

/**
 * Represents the user's portfolio data.
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
 * Represents the user's portfolio activity.
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
 * ========================
 * NFT Types
 * ========================
 */

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

/**
 * Represents the user's NFT balance.
 */
export type UserNFTBalance = {
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
 * ========================
 * Order Types
 * ========================
 */

/**
 * Represents an order.
 */
export type INTENT_TYPE =
  | 'RAW_TRANSACTION'
  | 'NFT_MINT'
  | 'TOKEN_TRANSFER'
  | 'NFT_TRANSFER';

export type STATUS_TYPE = 'SUCCESSFUL' | 'IN_PROGRESS' | 'FAILED';

export type Order = {
  downstreamTransactionHash: string[];
  transactionHash: string[];
  status: string;
  intentId: string;
  intentType: string;
  networkName: string;
  caipId: string;
  details: OrderDetails;
};

export type BaseDetails = {
  caip2Id: string;
};

export type RawTransactionDetails = BaseDetails & {
  transactions: Array<Array<{ Key: string; Value: string }>>;
};

export type NftMintDetails = BaseDetails & {
  collectionName: string;
  description: string;
  nftName: string;
  properties: Array<{ name: string; value: string; valueType: string }>;
  uri: string;
};

export type TokenTransferDetails = BaseDetails & {
  amount: string;
  networkId: string;
  recipientWalletAddress: string;
  tokenAddress: string;
};

export type NftTransferDetails = BaseDetails & {
  collectionAddress?: string;
  nftId?: string;
  recipientWalletAddress: string;
  amount?: string;
  nftType?: string;
};

export type OrderDetails =
  | (RawTransactionDetails & { intent_type: 'RAW_TRANSACTION' })
  | (NftMintDetails & { intent_type: 'NFT_MINT' })
  | (TokenTransferDetails & { intent_type: 'TOKEN_TRANSFER' })
  | (NftTransferDetails & { intent_type: 'NFT_TRANSFER' });

export type OrderFilterRequest = {
  intentId?: string;
  status?: STATUS_TYPE;
  intentType?: INTENT_TYPE;
};

/**
 * ========================
 * Estimate Types
 * ========================
 */

/**
 * Represents the payload required for estimating an order.
 */
export type EstimateOrderPayload = {
  type: string;
  jobId: string;
  paymasterData?: Hash;
  gasDetails?: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  details: {
    recipientWalletAddress: string;
    networkId: string;
    tokenAddress: string;
    amount: string;
  };
};

/**
 * Represents the response for an order estimate.
 */
export type OrderEstimateResponse = {
  encodedCallData: string;
  encodedPaymaster: string;
  gasData: {
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    paymasterVerificationGasLimit: string;
    paymasterPostOpGasLimit: string;
  };
  paymasterData: {
    paymasterId: string;
    validUntil: string;
    validAfter: string;
  };
  details: {
    estimation: {
      amount: string;
    };
    fees: {
      transactionFees: Record<string, string>;
      approxTransactionFeesInUsdt: string;
    };
  };
  callData: {
    intentType: string;
    jobId: string;
    vendorId: string;
    creatorId: string;
    policies: {
      gsnEnabled: boolean;
      sponsorshipEnabled: boolean;
    };
    gsn: {
      isRequired: boolean;
      details: {
        requiredNetworks: string[];
        tokens: {
          networkId: string;
          address: string;
          amount: string;
          amountInUsdt: string;
        }[];
      };
    };
    payload: {
      recipientWalletAddress: string;
      networkId: string;
      tokenAddress: string;
      amount: string;
    };
  };
};
