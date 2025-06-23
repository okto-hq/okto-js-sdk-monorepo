import type OktoClient from '@/core/index.js';
import type { Address } from '@/types/core.js';
import { svmRawTransaction as useropgen } from '@/userop/svmRawTransaction.js';
import type { SolanaRawTransactionIntentParams } from '@/userop/types.js';

/**
 * Execute a Solana Raw Transaction.
 *
 * This function initiates the process of executing a raw transaction on the Solana blockchain
 * by encoding the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for the Solana raw transaction.
 * @param feePayerAddress - The address that will pay the transaction fee.
 * @returns A promise that resolves to the transaction ID or operation result.
 */
export async function svmRawTransaction(
  oc: OktoClient,
  data: SolanaRawTransactionIntentParams,
  feePayerAddress: Address,
): Promise<string> {
  const userop = await useropgen(oc, data, feePayerAddress);
  const signedUserOp = await oc.signUserOp(userop);
  const res = await oc.executeUserOp(signedUserOp);
  return res;
}