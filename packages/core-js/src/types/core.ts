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
  callData?: Hex;
  /** The amount of gas to allocate the main execution call */
  callGasLimit?: Hex;
  /** Account factory. Only for new accounts. */
  factory?: Address | undefined;
  /** Data for account factory. */
  factoryData?: Hex | undefined;
  /** Maximum fee per gas. */
  maxFeePerGas?: Hex;
  /** Maximum priority fee per gas. */
  maxPriorityFeePerGas?: Hex;
  /** Anti-replay parameter. */
  nonce?: Hex;
  /** Address of paymaster contract. */
  paymaster?: Address | undefined;
  /** Data for paymaster. */
  paymasterData?: Hex | undefined;
  /** The amount of gas to allocate for the paymaster post-operation code. */
  paymasterPostOpGasLimit?: Hex | undefined;
  /** The amount of gas to allocate for the paymaster validation code. */
  paymasterVerificationGasLimit?: Hex | undefined;
  /** Extra gas to pay the Bundler. */
  preVerificationGas?: Hex;
  /** The account making the operation. */
  sender?: Address;
  /** Data passed into the account to verify authorization. */
  signature?: Hex;
  /** The amount of gas to allocate for the verification step. */
  verificationGasLimit?: Hex;
};

export type PackedUserOp = {
  /** Concatenation of {@link UserOperation`verificationGasLimit`} (16 bytes) and {@link UserOperation`callGasLimit`} (16 bytes) */
  accountGasLimits: Hex;
  /** The data to pass to the `sender` during the main execution call. */
  callData: Hex;
  /** Concatenation of {@link UserOperation`factory`} and {@link UserOperation`factoryData`}. */
  initCode: Hex;
  /** Concatenation of {@link UserOperation`maxPriorityFee`} (16 bytes) and {@link UserOperation`maxFeePerGas`} (16 bytes) */
  gasFees: Hex;
  /** Anti-replay parameter. */
  nonce: Hex;
  /** Concatenation of paymaster fields (or empty). */
  paymasterAndData: Hex;
  /** Extra gas to pay the Bundler. */
  preVerificationGas: Hex;
  /** The account making the operation. */
  sender: Address;
  /** Data passed into the account to verify authorization. */
  signature?: Hex;
};
