export type GetUserKeysResult = {
  userId: string;
  userSWA: string;
  ecdsaPublicKey: string;
  eddsaPublicKey: string;
  ecdsaKeyId: string;
  eddsaKeyId: string;
};

export type SignMessageParams = {
  data: {
    userData: {
      jobId: string;
      sessionPk: string;
    };
    transactions: {
      transactionId: string;
      method: string;
      signingMessage: string;
      userSessionSignature: string;
    }[];
  };
};

export type SignMessageResult = {
  status: string;
  signRequestId: string;
  data: {
    transactionId: string;
    signature: string;
  }[];
};
