export type ByteArray = Uint8Array;
export type Address = `0x${string}`;
export type Hex = `0x${string}`;
export type Hash = `0x${string}`;
export type uint256 = bigint;

export type User = {
  userId: string;
  userAddress: string;
  ecdsaPublicKey: string;
  eddsaPublicKey: string;
  sessionExpiry: string;
};

export type UserOp = {
  /** The data to pass to the `sender` during the main execution call. */
  callData: Hex;
  /** The amount of gas to allocate the main execution call */
  callGasLimit: uint256;
  /** Account factory. Only for new accounts. */
  factory?: Address | undefined;
  /** Data for account factory. */
  factoryData?: Hex | undefined;
  /** Maximum fee per gas. */
  maxFeePerGas: uint256;
  /** Maximum priority fee per gas. */
  maxPriorityFeePerGas: uint256;
  /** Anti-replay parameter. */
  nonce: uint256;
  /** Address of paymaster contract. */
  paymaster?: Address | undefined;
  /** Data for paymaster. */
  paymasterData?: Hex | undefined;
  /** The amount of gas to allocate for the paymaster post-operation code. */
  paymasterPostOpGasLimit?: uint256 | undefined;
  /** The amount of gas to allocate for the paymaster validation code. */
  paymasterVerificationGasLimit?: uint256 | undefined;
  /** Extra gas to pay the Bundler. */
  preVerificationGas: uint256;
  /** The account making the operation. */
  sender: Address;
  /** Data passed into the account to verify authorization. */
  signature: Hex;
  /** The amount of gas to allocate for the verification step. */
  verificationGasLimit: uint256;
};
