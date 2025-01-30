import type { Address, Hash, Hex } from '@/types/core.js';

export type Env = 'sandbox' | 'production';

export interface EnvConfig {
  gatewayBaseUrl: string;
  bffBaseUrl: string;
  paymasterAddress: Address;
  jobManagerAddress: Address;
  chainId: number;
}

export interface VendorConfig {
  vendorPubKey: string;
  vendorPrivKey: Hash;
  vendorSWA: Hex;
}

export interface SessionConfig {
  sessionPubKey: string;
  sessionPrivKey: Hash;
  userSWA: Hex;
}

export interface AuthParams {
  vendorPrivKey: Hash;
  vendorSWA: Hex;
}
