import type { UserOp } from '../core.js';

export interface TokenSwapIntentParams {
  routeId?: string;
  fromChainCaip2Id: string;
  fromChainTokenAmount: string;
  toChainCaip2Id: string;
  minToTokenAmount: string | null;
  fromChainTokenAddress?: string;
  toChainTokenAddress?: string;
  slippage?: string | null;
  sameChainFee?: string | null;
  sameChainFeeCollector?: string | null;
  crossChainFee?: string | null;
  crossChainFeeCollector?: string | null;
  advancedSettings?: Uint8Array | string | null;
}

// Type definition for swap estimate response
export interface SwapEstimateResponse {
  callData: {
    clientSWA: string;
    feePayerAddress: string;
    gsn: {
      isPossible: boolean;
      isRequired: boolean;
      requiredNetworks: [];
      tokens: [];
    };
    intentType: string;
    jobId: string;
    payload: {
      crossChainFee: string;
      crossChainFeeCollector: string;
      fromChainCaip2Id: string;
      fromChainTokenAddress: string;
      fromChainTokenAmount: string;
      routeId: string;
      sameChainFee: string;
      sameChainFeeCollector: string;
      slippage: string;
      toChainCaip2Id: string;
      toChainTokenAddress: string;
      minToTokenAmount: string;
    };
    policies: {
      gsnEnabled: boolean;
      sponsorshipEnabled: boolean;
    };
    userSWA: string;
  };
  details: SwapDetails;
  userOps: UserOp;
}

// Type definition for swap details
export interface SwapDetails {
  estimation: {
    amount: string;
    crossChainFee: string;
    crossChainFeeCollector: string;
    outputAmount: string;
    recommendedSlippage: string;
    routeId: string;
    routeValidUntil: string;
    sameChainFee: string;
    sameChainFeeCollector: string;
    slippageUsed: string;
  };
  swapFees?: {
    totalFeesInInputToken: string;
    platformBaseFeesInInputToken: string;
    gasFeesInInputToken: string;
    integratorFeesInInputToken: string;
  };
  fees: {
    approxTransactionFeesInUSDT: string;
    transactionFees: Record<string, string>;
  };
}

// Type definition for the swap estimate request body
export interface SwapEstimateRequest {
  type: string;
  jobId: string;
  paymasterData: string;
  gasDetails: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  details: {
    fromChainTokenAddress: string;
    fromChainCaip2Id: string;
    toChainTokenAddress: string;
    toChainCaip2Id: string;
    sameChainFee: string;
    sameChainFeeCollector: string;
    crossChainFee: string;
    crossChainFeeCollector: string;
    fromChainTokenAmount: string;
    minToTokenAmount: string;
    slippage: string;
    advancedSettings?: Record<string, string>;
  };
}
