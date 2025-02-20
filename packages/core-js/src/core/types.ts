import type { Address, Hash, Hex } from '@/types/core.js';

export type Env = 'staging' | 'sandbox';

export interface EnvConfig {
  gatewayBaseUrl: string;
  bffBaseUrl: string;
  paymasterAddress: Address;
  jobManagerAddress: Address;
  chainId: number;
}

export interface ClientConfig {
  clientPubKey: string;
  clientPrivKey: Hash;
  clientSWA: Hex;
}

export interface SessionConfig {
  sessionPubKey: string;
  sessionPrivKey: Hash;
  userSWA: Hex;
}

export interface AuthParams {
  clientPrivateKey: Hash;
  clientSWA: Hex;
}
