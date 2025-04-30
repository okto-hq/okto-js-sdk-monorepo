import type OktoClient from '@/core/index.js';
import { aptosRawTransaction as useropgen } from '@/userop/aptosRawTransaction.js';
import type { AptosRawTransactionIntentParams } from '@/userop/types.js';

/**
 * Execute an Aptos Raw Transaction.
 *
 * This function initiates the process of executing a raw transaction on the Aptos blockchain
 * by encoding the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for the Aptos raw transaction.
 * @returns A promise that resolves to the transaction ID or operation result.
 */
export async function aptosRawTransaction(
  oc: OktoClient,
  data: AptosRawTransactionIntentParams,
): Promise<string> {
  const userop = await useropgen(oc, data);
  const signedUserOp = await oc.signUserOp(userop);
  const res = await oc.executeUserOp(signedUserOp);
  return res;
}
