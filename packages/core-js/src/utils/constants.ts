import type { Hex } from '@/types/core.js';

export class Constants {
  static readonly HOURS_IN_MS = 60 * 60 * 1000;

  static readonly ENTRYPOINT_CONTRACT_ADDRESS =
    '0x8D29ECb381CA4874767Ef3744F6df37748B12715';

  static readonly EXECUTE_USEROP_FUNCTION_SELECTOR = '0x8dd7712f';

  static readonly FUNCTION_NAME = 'initiateJob';

  static readonly USEROP_VALUE = BigInt(0);

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
    NFT_COLLECTION_CREATION: 'NFT_COLLECTION_CREATION',
    RAW_TRANSACTION: 'RAW_TRANSACTION',
  };

  static readonly ENV_CONFIG = {
    SANDBOX: {
      PAYMASTER_ADDRESS: '0x0871051BfF8C7041c985dEddFA8eF63d23AD3Fa0' as Hex,
      JOB_MANAGER_ADDRESS: '0xED3D17cae886e008D325Ad7c34F3bdE030B80c2E' as Hex,
      CHAIN_ID: 24879,
    },
    PRODUCTION: {
      PAYMASTER_ADDRESS: '0x0871051BfF8C7041c985dEddFA8eF63d23AD3Fa0' as Hex,
      JOB_MANAGER_ADDRESS: '0xED3D17cae886e008D325Ad7c34F3bdE030B80c2E' as Hex,
      CHAIN_ID: 24879,
    },
  };
}
