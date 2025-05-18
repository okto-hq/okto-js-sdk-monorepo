import type { Address, UserOp } from '@/types/core.js';
import type {
  AptosRawTransaction,
  NftCreateCollectionParams,
} from '@/userop/types.js';

/**
 * ========================
 * Token Transfer Estimate Types
 * ========================
 */

export interface TokenTransferEstimateRequest {
  type: string;
  jobId: string;
  feePayerAddress?: Address;
  paymasterDetails?: {
    validUntil: string;
    validAfter: string;
  };
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
  details: TokenTransferEstimateDetails;
  userOps: UserOp;
}

export interface TokenTransferEstimateDetails {
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
    amount?: number | bigint;
    nftType?: string;
  };
}

export interface NFTTransferEstimateResponse {
  userOps: UserOp;
  details: NFTTransferEstimateDetails;
}

export interface NFTTransferEstimateDetails {
  estimation: {
    amount?: string;
  };
  callData: {
    transactionFees: Record<string, string>;
    approxTransactionFeesInUSDT: string;
    gsn: {
      isRequired: boolean;
      isPossible: boolean;
      details: {
        requiredNetworks: string[];
        tokens: Array<{
          networkId: string;
          address: string;
          amount: string;
          amountInUSDT: string;
        }>;
      };
    };
    payload: {
      networkId: string;
      nftId: string;
      recipientWalletAddress: string;
      amount: string;
      ercType: string;
    };
  };
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
