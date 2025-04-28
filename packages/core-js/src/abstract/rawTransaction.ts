import type OktoClient from '@/core/index.js';
import { evmRawTransaction as useropgen } from '@/userop/rawTransaction.js';
import type { RawTransactionIntentParams } from '@/userop/types.js';
import type { Address } from '@/types/core.js';

/**
 * Do a Raw Transaction on any EVM Chain.
 */
export async function evmRawTransaction(
  oc: OktoClient,
  data: RawTransactionIntentParams,
  feePayerAddress?: Address,
): Promise<string> {
  const userop = await useropgen(oc, data, feePayerAddress);
  const signedUserOp = await oc.signUserOp(userop);
  const res = await oc.executeUserOp(signedUserOp);
  return res;
}
