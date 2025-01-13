import type { Address } from 'viem';

export type Env = 'sandbox' | 'production';

export interface EnvConfig {
  gatewayBaseUrl: string;
  bffBaseUrl: string;
  paymasterAddress: Address;
}

export interface AuthOptions {
  sessionPubKey?: string;
  sessionPrivKey?: string;
  vendorPubKey?: string;
  vendorPrivKey?: string;
  userSWA?: string;
  vendorSWA?: string;
}
