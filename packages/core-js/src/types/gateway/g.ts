import type { Hex } from '../core.js';

export type getUserOperationGasPriceResult = {
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
};
