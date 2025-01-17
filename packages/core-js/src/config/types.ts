import type { Hash, Hex } from '@/types/core.js';
import type { Address } from 'viem';

export type Env = 'sandbox' | 'production';

export interface EnvConfig {
  gatewayBaseUrl: string;
  bffBaseUrl: string;
  paymasterAddress: Address;
}

export interface AuthOptions {
  sessionPubKey?: string;
  sessionPrivKey?: Hash;
  vendorPubKey?: string;
  vendorPrivKey?: Hash;
  userSWA?: Hex;
  vendorSWA?: Hex;
}
