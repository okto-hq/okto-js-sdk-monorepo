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
  clientSWA: string;
  sessionPk: string;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  paymaster: string;
  paymasterData: string;
};

export type AuthenticatePayloadParam = {
  authData: AuthData;
  sessionData: AuthSessionData;
  sessionPkClientSignature: string;
  sessionDataUserSignature: string;
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
  userSWA: string;
  clientId: string;
  clientSWA: string;
  isSessionAdded: boolean;
  signAuthRelayerUserOps: string;
};
