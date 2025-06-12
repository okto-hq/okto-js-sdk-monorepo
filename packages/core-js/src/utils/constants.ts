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
    SWAP: 'SWAP',
  };

  static readonly ENV_CONFIG = {
    STAGING: {
      PAYMASTER_ADDRESS: '0xc2D31Cdc6EFd02F85Ab943c4587f8D60E6E15F9c' as Hex,
      JOB_MANAGER_ADDRESS: '0x57820589F31a9e4a34A0299Ea4aDe7c536139682' as Hex,
      ENTRYPOINT_CONTRACT_ADDRESS:
        '0x322eF240AD89d19a50Ca092CF70De9603bf6778E' as Hex,
      CHAIN_ID: 124736089,
      AUTH_PAGE_URL: 'https://onboarding.oktostage.com/',
      AUTH_REDIRECT_URL: 'https://onboarding.oktostage.com/__/auth/handler',
      SIGN_MESSAGE_MPC_THRESHOLD: 3,
      ON_RAMP_URL: 'https://pay.oktostage.com',
    },
    SANDBOX: {
      PAYMASTER_ADDRESS: '0x74324fA6Fa67b833dfdea4C1b3A9898574d076e3' as Hex,
      JOB_MANAGER_ADDRESS: '0x0543aD80b41C5f5956d34503668CDb965deCB617' as Hex,
      ENTRYPOINT_CONTRACT_ADDRESS:
        '0xCa5b1b0d3893b5152014fD5B519FF50f7C40f9da' as Hex,
      CHAIN_ID: 1802466136,
      AUTH_PAGE_URL: 'https://sandbox-onboarding.okto.tech/',
      ON_RAMP_URL: 'https://sandbox-pay.okto.tech',
      AUTH_REDIRECT_URL: 'https://sandbox-onboarding.okto.tech/__/auth/handler',
      SIGN_MESSAGE_MPC_THRESHOLD: 2,
    },
    PRODUCTION: {
      PAYMASTER_ADDRESS: '0xB0E2BD2EFb99F982F8cCB8e6737A572B3B0eCE11' as Hex,
      JOB_MANAGER_ADDRESS: '0x7F1E1e98Dde775Fae0d340D3E5D28004Db58A0d3' as Hex,
      ENTRYPOINT_CONTRACT_ADDRESS:
        '0x0b643Bcd21a72b10075F1938Ebebba6E077A1742' as Hex,
      CHAIN_ID: 8088,
      AUTH_PAGE_URL: 'https://onboarding.okto.tech/',
      AUTH_REDIRECT_URL: 'https://onboarding.okto.tech/__/auth/handler',
      SIGN_MESSAGE_MPC_THRESHOLD: 2,
    },
  };

  static readonly GOOGLE_CLIENT_ID =
    '625834323626-c0rnc34fogig1n059prr5q73p6a6uulf.apps.googleusercontent.com';

  static readonly APPLE_CLIENT_ID = 'tech.okto.si';
}
