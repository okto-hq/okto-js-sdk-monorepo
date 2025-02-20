import type OktoClient from '@/core/index.js';
import { tokenTransfer as useropgen } from '@/userop/tokenTransfer.js';
import type { TokenTransferIntentParams } from '@/userop/types.js';

/**
 * Do a Token Transfer.
 *
 * This function initiates the process of transferring a token by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for transferring the token (caip2Id, recipientWalletAddress, tokenAddress, amount).
 * @returns The User Operation (UserOp) for the token transfer.
 */
export async function tokenTransfer(
  oc: OktoClient,
  data: TokenTransferIntentParams,
): Promise<string> {
  const userop = await useropgen(oc, data);
  const signedUserOp = await oc.signUserOp(userop);
  const res = await oc.executeUserOp(signedUserOp);
  return res;
}
