import type { Address, Hash, Hex } from '@/types/core.js';

export type Env = 'staging' | 'sandbox';

export interface EnvConfig {
  gatewayBaseUrl: string;
  bffBaseUrl: string;
  paymasterAddress: Address;
  jobManagerAddress: Address;
  entryPointAddress: Address;
  chainId: number;
  authPageUrl: string;
  onrampUrl: string;
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
  email?: string;
}

export interface AuthParams {
  clientPrivateKey: Hash;
  clientSWA: Hex;
}
