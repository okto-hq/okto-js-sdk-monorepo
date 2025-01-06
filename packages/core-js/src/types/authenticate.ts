export type AuthenticatePayloadParams = {
  authData: {
    idToken: string;
    provider: string;
  };
  sessionData: {
    nonce: string;
    vendorAddress: string;
    sessionPk: string;
    maxPriorityFeePerGas: string;
    maxFeePerGas: string;
    paymaster: string;
    paymasterData: string;
  };
  additionalData: string;
  authDataVendorSign: string;
  sessionDataVendorSign: string;
  authDataUserSign: string;
  sessionDataUserSign: string;
};

export type AuthenticateResult = {
  ecdsaPublicKey: string;
  eddsaPublicKey: string;
  userId: string;
  jobId: string;
  sessionExpiry: string;
  userAddress: string;
};
