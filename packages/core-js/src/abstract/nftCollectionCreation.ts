import type OktoClient from '@/core/index.js';
import { nftCreateCollection as useropgen } from '@/userop/nftCollectionCreation.js';
import type { NftCreateCollectionParams } from '@/userop/types.js';

/**
 * Create an NFT Collection.
 *
 * This function initiates the process of creating an NFT collection by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for creating the NFT collection (caip2Id, name, uri, data with attributes, symbol, type, description).
 * @returns A promise that resolves to the transaction ID or operation result.
 */
export async function nftCreateCollection(
  oc: OktoClient,
  data: NftCreateCollectionParams,
): Promise<string> {
  const userop = await useropgen(oc, data);
  const signedUserOp = await oc.signUserOp(userop);
  const res = await oc.executeUserOp(signedUserOp);
  return res;
}
