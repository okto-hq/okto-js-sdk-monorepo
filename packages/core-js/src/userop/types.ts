import type { Address } from '@/types/core.js';

export type TokenTransferIntentParams = {
  amount: number | bigint;
  recipient: string;
  token: string | '';
  chain: string;
};

export type NFTTransferIntentParams = {
  networkId: string;
  nftId: string;
  recipient: Address;
  amount: number | bigint;
  ercType: string;
};

