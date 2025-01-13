import type { Address } from '@/types/core.js';

export type TokenTransferIntentParams = {
  amount: number | bigint;
  recipient: Address;
  token: Address;
  chain: string;
};
