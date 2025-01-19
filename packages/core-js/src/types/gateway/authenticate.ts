export type AuthData =
  | {
      idToken: string;
      provider: 'google';
    }
  | {
      authToken: string;
      provider: 'okto';
    };

export type AuthSessionData = {
  nonce: string;
  vendorSWA: string;
  sessionPk: string;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  paymaster: string;
  paymasterData: string;
};

export type AuthenticatePayloadParam = {
  authData: AuthData;
  sessionData: AuthSessionData;
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

export type UserSessionResponse = {
  userId: string;
  userAddress: string;
  vendorId: string;
  vendorAddress: string;
};
