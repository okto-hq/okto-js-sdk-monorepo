import type { Hex } from '@/types/core.js';

export class Constants {
  static readonly HOURS_IN_MS = 60 * 60 * 1000;

  static readonly EXECUTE_USEROP_FUNCTION_SELECTOR = '0x8dd7712f';

  static readonly FUNCTION_NAME = 'initiateJob';

  static readonly USEROP_VALUE = BigInt(0);

  static readonly FEE_PAYER_ADDRESS =
    '0x0000000000000000000000000000000000000000';

  static readonly GAS_LIMITS = {
    CALL_GAS_LIMIT: BigInt(600_000),
    VERIFICATION_GAS_LIMIT: BigInt(400_000),
    PRE_VERIFICATION_GAS: BigInt(100_000),
    MAX_FEE_PER_GAS: BigInt(4_000_000_000),
    MAX_PRIORITY_FEE_PER_GAS: BigInt(4_000_000_000),
    PAYMASTER_POST_OP_GAS_LIMIT: BigInt(200_000),
    PAYMASTER_VERIFICATION_GAS_LIMIT: BigInt(200_000),
  };

  static readonly INTENT_TYPE = {
    TOKEN_TRANSFER: 'TOKEN_TRANSFER',
    NFT_TRANSFER: 'NFT_TRANSFER',
    NFT_CREATE_COLLECTION: 'NFT_CREATE_COLLECTION',
    RAW_TRANSACTION: 'RAW_TRANSACTION',
    NFT_MINT: 'NFT_MINT',
  };

  static readonly ENV_CONFIG = {
    STAGING: {
      PAYMASTER_ADDRESS: '0xc2D31Cdc6EFd02F85Ab943c4587f8D60E6E15F9c' as Hex,
      JOB_MANAGER_ADDRESS: '0x57820589F31a9e4a34A0299Ea4aDe7c536139682' as Hex,
      ENTRYPOINT_CONTRACT_ADDRESS:
        '0x322eF240AD89d19a50Ca092CF70De9603bf6778E' as Hex,
      CHAIN_ID: 124736089,
      AUTH_PAGE_URL: 'https://onboarding.oktostage.com/',
    },
    SANDBOX: {
      PAYMASTER_ADDRESS: '0x74324fA6Fa67b833dfdea4C1b3A9898574d076e3' as Hex,
      JOB_MANAGER_ADDRESS: '0x0543aD80b41C5f5956d34503668CDb965deCB617' as Hex,
      ENTRYPOINT_CONTRACT_ADDRESS:
        '0xCa5b1b0d3893b5152014fD5B519FF50f7C40f9da' as Hex,
      CHAIN_ID: 1802466136,
      AUTH_PAGE_URL: 'https://sandbox-onboarding.okto.tech/',
    },
    // PRODUCTION: {
    //   PAYMASTER_ADDRESS: '0x0871051BfF8C7041c985dEddFA8eF63d23AD3Fa0' as Hex,
    //   JOB_MANAGER_ADDRESS: '0xED3D17cae886e008D325Ad7c34F3bdE030B80c2E' as Hex,
    //   CHAIN_ID: 24879,
    // },
  };

  static readonly GOOGLE_CLIENT_ID =
    '54780876714-t59u4t7r1pekdj3p54grd9nh4rfg8qvd.apps.googleusercontent.com';
}
