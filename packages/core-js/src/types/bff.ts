export type GetSupportedNetworksResponseData = {
  caip_id: string;
  network_name: string;
  chain_id: string;
  logo: string;
};

export type UserSessionResponse = {
  user_id: string;
  user_address: string;
  vendor_id: string;
  vendor_address: string;
};

export type EstimateOrderPayload = {
  type: string;
  jobId: string;
  paymasterDetails?: {
    validUntil: string;
    validAfter: string;
  };
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
      approxTransactionFeesInUSDT: string;
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
          amountInUSDT: string;
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

