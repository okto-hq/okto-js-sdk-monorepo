export type ByteArray = Uint8Array;
export type Hex = `0x${string}`;
export type Hash = `0x${string}`;

export type User = {
  userId: string;
  userAddress: string;
  ecdsaPublicKey: string;
  eddsaPublicKey: string;
  sessionExpiry: string;
};

export type UserOp = {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  signature: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
  preVerificationGas: string;
  paymasterAndData: string;
};

// export type UserOp = RpcUserOperation<'0.7'>;
