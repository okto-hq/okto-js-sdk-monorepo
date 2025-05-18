import type { Address, UserOp } from '@/types/core.js';
import type {
  AptosRawTransaction,
  NftCreateCollectionParams,
} from '@/userop/types.js';

/**
 * ========================
 * Estimate Details Type
 * ========================
 */

export interface EstimationDetails {
  estimation: {
    amount: string;
    crossChainFee: string;
    crossChainFeeCollector: string;
    gasFeesInInputToken: string;
    integratorFeesInInputToken: string;
    outputAmount: string;
    platformBaseFeesInInputToken: string;
    recommendedSlippage: string;
    routeId: string;
    routeValidUntil: string;
    sameChainFee: string;
    sameChainFeeCollector: string;
    slippageUsed: string;
    totalFeesInInputToken: string;
  };
  fees: {
    transactionFees: {
      [networkId: string]: string;
    };
    approxTransactionFeesInUSDT: string;
  };
  swapFees: {
    gasFeesInInputToken: string;
    integratorFeesInInputToken: string;
    platformBaseFeesInInputToken: string;
    totalFeesInInputToken: string;
  };
}

/**
 * ========================
 * Token Transfer Estimate Types
 * ========================
 */

export interface TokenTransferEstimateRequest {
  type: string;
  jobId: string;
  feePayerAddress?: Address;
  paymasterData: string;
  gasDetails: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  details: {
    recipientWalletAddress: string;
    caip2Id: string;
    tokenAddress: string;
    amount: string;
  };
}

export interface TokenTransferEstimateResponse {
  details: EstimationDetails;
  userOps: UserOp;
}

/**
 * ========================
 * NFT Transfer Estimate Types
 * ========================
 */

export interface NFTTransferEstimateRequest {
  type: string;
  jobId: string;
  feePayerAddress?: Address;
  paymasterData: string;
  gasDetails: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  details: {
    caip2Id: string;
    collectionAddress?: string;
    nftId?: string;
    recipientWalletAddress: string;
    amount?: string;
    nftType?: string;
  };
}

export interface NFTTransferEstimateResponse {
  userOps: UserOp;
  details: EstimationDetails;
}

/**
 * ========================
 * EVM Raw Transaction Estimate Types
 * ========================
 */

export interface Transaction {
  data?: string;
  from: Address;
  to: Address;
  value?: string;
}

export interface EvmRawTransactionEstimateRequest {
  type: string;
  jobId: string;
  paymasterData: string;
  gasDetails: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  details: {
    caip2Id: string;
    transactions: Array<{
      data?: string;
      from: string;
      to: string;
      value?: string;
    }>;
  };
  feePayerAddress?: string;
}

export interface EvmRawTransactionEstimateResponse {
  userOps: UserOp;
  details: RawTransactionEstimateDetails;
}

export interface RawTransactionEstimateDetails {
  estimation: {
    amount: string;
  };
  fees: {
    transactionFees: {
      [networkId: string]: string;
    };
    approxTransactionFeesInUSDT: string;
  };
}

/**
 * ========================
 * APTOS Raw Transaction Estimate Types
 * ========================
 */

export interface AptosRawTransactionEstimateRequest {
  type: string;
  jobId: string;
  paymasterData: string;
  gasDetails: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  details: {
    caip2Id: string;
    transactions: Array<{
      transactionData: AptosRawTransaction;
    }>;
  };
  feePayerAddress?: Address;
}

export interface AptosRawTransactionEstimateResponse {
  details: RawTransactionEstimateDetails;
  userOps: UserOp;
}

/**
 * ========================
 * NFT Mint Estimate Types
 * ========================
 */

export interface NftMintEstimateRequest {
  type: string;
  jobId: string;
  gasDetails: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  feePayerAddress?: string;
  paymasterData: string;
  details: {
    caip2Id: string;
    nftName: string;
    collectionAddress?: string;
    uri: string;
    data: {
      recipientWalletAddress?: string;
      description?: string;
      properties: Array<{
        name: string;
        type: string | number;
        value: string;
      }>;
    };
  };
}

export interface NftMintEstimateDetails {
  estimation: {
    amount: string;
  };
  fees: {
    transactionFees: {
      [networkId: string]: string;
    };
    approxTransactionFeesInUSDT: string;
  };
}

export interface NftMintEstimateResponse {
  userOps: UserOp;
  details: NftMintEstimateDetails;
}

/**
 * ========================
 * NFT Collection Creation Estimate Types
 * ========================
 */

export interface NftCollectionEstimateDetails {
  estimation: {
    amount: string;
  };
  fees: {
    transactionFees: {
      [networkId: string]: string;
    };
    approxTransactionFeesInUSDT: string;
  };
}

export interface NftCreateCollectionEstimateResponse {
  userOps: UserOp;
  details: NftCollectionEstimateDetails;
}

export interface NftCreateCollectionEstimateRequest {
  type: string;
  jobId: string;
  gasDetails: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  feePayerAddress?: string;
  paymasterData: string;
  details: NftCreateCollectionParams;
}
