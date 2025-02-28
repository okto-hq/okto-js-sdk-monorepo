import type { Hex } from '../core.js';

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
      userSWA: Hex;
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
  transactionId: string;
  signature: string;
}[];
