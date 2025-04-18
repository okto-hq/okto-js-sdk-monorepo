import type { Hex } from '@/types/core.js';

export class Constants {
  static readonly HOURS_IN_MS = 60 * 60 * 1000;

  static readonly EXECUTE_USEROP_FUNCTION_SELECTOR = '0x8dd7712f';

  static readonly FUNCTION_NAME = 'initiateJob';

  static readonly USEROP_VALUE = BigInt(0);

  static readonly FEE_PAYER_ADDRESS =
    '0x0000000000000000000000000000000000000000';

  static readonly GAS_LIMITS = {
    CALL_GAS_LIMIT: BigInt(300_000),
    VERIFICATION_GAS_LIMIT: BigInt(200_000),
    PRE_VERIFICATION_GAS: BigInt(50_000),
    MAX_FEE_PER_GAS: BigInt(2_000_000_000),
    MAX_PRIORITY_FEE_PER_GAS: BigInt(2_000_000_000),
    PAYMASTER_POST_OP_GAS_LIMIT: BigInt(100_000),
    PAYMASTER_VERIFICATION_GAS_LIMIT: BigInt(100_000),
  };

  static readonly INTENT_TYPE = {
    TOKEN_TRANSFER: 'TOKEN_TRANSFER',
    NFT_TRANSFER: 'NFT_TRANSFER',
    NFT_COLLECTION_CREATION: 'NFT_CREATE_COLLECTION',
    RAW_TRANSACTION: 'RAW_TRANSACTION',
    NFT_MINT: 'NFT_MINT',
  };

  static readonly ENV_CONFIG = {
    STAGING: {
      PAYMASTER_ADDRESS: '0xdAa292E9B9a6B287c84d636F3b65f4A5Dc787e3f' as Hex,
      JOB_MANAGER_ADDRESS: '0xb5e77f7Ff1ab31Fc1bE99F484DB62f01a6b93D4d' as Hex,
      ENTRYPOINT_CONTRACT_ADDRESS:
        '0xec3F5f7a3f0e43e61D8711A90B8c8Fc59B9a88ba' as Hex,
      CHAIN_ID: 124736089,
    },
    SANDBOX: {
      PAYMASTER_ADDRESS: '0x5408fAa7F005c46B85d82060c532b820F534437c' as Hex,
      JOB_MANAGER_ADDRESS: '0x21E822446C32FA22b29392F29597ebdcFd8511f8' as Hex,
      ENTRYPOINT_CONTRACT_ADDRESS:
        '0xA5E95a08229A816c9f3902E4a5a618C3928ad3bA' as Hex,
      CHAIN_ID: 8801,
    },
    // PRODUCTION: {
    //   PAYMASTER_ADDRESS: '0x0871051BfF8C7041c985dEddFA8eF63d23AD3Fa0' as Hex,
    //   JOB_MANAGER_ADDRESS: '0xED3D17cae886e008D325Ad7c34F3bdE030B80c2E' as Hex,
    //   CHAIN_ID: 24879,
    // },
  };
}
