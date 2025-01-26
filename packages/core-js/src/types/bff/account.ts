import type { Hash } from '../core.js';
import type { Network } from './common.js';

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
export type Order = {
  intentId: string;
  transactionHash: string[];
  userAddress: string;
  vendorAddress: string;
  params: any | null;
  gsnParams: {
    isRequired: boolean;
    requiredNetworks: string[];
    tokens:
      | {
          amountInUSDT: string;
          maxAmount: string;
          networkId: string;
          tokenAddress: string;
        }[]
      | null;
  };
  status: string;
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
 * Represents the  gas fees required for UserOP
 */
export type GasFeeData = {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};



/**
 * Represents the response for an order estimate.
 */
export type OrderEstimateResponse = {
  status: string;
  data: {
    details: {
      estimation: {
        amount: string;
      };
      fees: {
        transactionFees: {
          [key: string]: string;
        };
        approxTransactionFeesInUSDT: string;
      };
    };
    callData: {
      intentType: string;
      jobId: string;
      vendorId: string;
      creatorId: string;
      policies: {
        isGsnEnabled: boolean;
        isSponsorshipEnabled: boolean;
      };
      gsn: {
        isPossible: boolean;
        isRequired: boolean;
        requiredNetworks: string[];
        tokens: string[];
      };
      payload: {
        amount: string;
        networkId: string;
        recipientWalletAddress: string;
        tokenAddress: string;
      };
    };
    userOps: {
      sender: string;
      nonce: string;
      callData: string;
      callGasLimit: string;
      verificationGasLimit: string;
      preVerificationGas: string;
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      paymaster: string;
      paymasterVerificationGasLimit: string;
      paymasterPostOpGasLimit: string;
      paymasterData: string;
    };
  };
};