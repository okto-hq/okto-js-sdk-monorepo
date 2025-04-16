import type OktoClient from '@/core/index.js';
import { evmRawTransaction as useropgen } from '@/userop/evmRawTransaction.js';
import type { EVMRawTransactionIntentParams } from '@/userop/types.js';

/**
 * Do a Raw Transaction on any EVM Chain.
 */
export async function evmRawTransaction(
  oc: OktoClient,
  data: EVMRawTransactionIntentParams,
): Promise<string> {
  const userop = await useropgen(oc, data);
  const signedUserOp = await oc.signUserOp(userop);
  const res = await oc.executeUserOp(signedUserOp);
  return res;
}
