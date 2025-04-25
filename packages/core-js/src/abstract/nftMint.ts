import type OktoClient from '@/core/index.js';
import { nftMint as useropgen } from '@/userop/nftMint.js';
import type { NftMintParams } from '@/userop/types.js';

/**
 * Mint an NFT.
 *
 * This function initiates the process of minting an NFT by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for minting an NFT (caip2Id, nftName, collectionAddress, uri, and additional data).
 * @returns A promise that resolves to the transaction ID or operation result.
 */
export async function nftMint(
  oc: OktoClient,
  data: NftMintParams,
): Promise<string> {
  const userop = await useropgen(oc, data);
  const signedUserOp = await oc.signUserOp(userop);
  const res = await oc.executeUserOp(signedUserOp);
  return res;
}
