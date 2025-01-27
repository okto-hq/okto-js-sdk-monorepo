import type { Hash, Hex } from '@/types/core.js';

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
