export type AuthData =
  | {
      idToken: string;
      provider: 'google';
    }
  | {
      idToken: string;
      provider: 'okto';
    }
  | {
      idToken: string;
      provider: 'client_jwt';
    }
  | {
      idToken: string;
      provider: 'apple';
    };

export type AuthSessionData = {
  nonce: string;
  clientSWA: string;
  sessionPk: string;
  // maxPriorityFeePerGas: string;
  // maxFeePerGas: string;
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
  userSWA: string;
  nonce: string;
  clientSWA: string;
  sessionExpiry: string;
};

export type UserSessionResponse = {
  userId: string;
  userSwa: string;
  clientId: string;
  clientSwa: string;
  isSessionAdded: boolean;
  signAuthRelayerUserOps: string;
};
