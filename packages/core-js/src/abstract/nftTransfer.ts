import type OktoClient from '@/core/index.js';
import { nftTransfer as useropgen } from '@/userop/nftTransfer.js';
import type { NFTTransferIntentParams } from '@/userop/types.js';

/**
 * Do a NFT transfer.
 *
 * This function initiates the process of transferring an NFT by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param data - The parameters for transferring the NFT (caip2Id, collectionAddress, nftId, recipientWalletAddress, amount, type).
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @returns The User Operation (UserOp) for the NFT transfer.
 */

export async function nftTransfer(
  oc: OktoClient,
  data: NFTTransferIntentParams,
): Promise<string> {
  const userop = await useropgen(oc, data);
  const signedUserOp = await oc.signUserOp(userop);
  const res = await oc.executeUserOp(signedUserOp);
  return res;
}
