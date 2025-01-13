import type { Network } from "./common.js";


/**
 * Represents Token data
 */

export type Token = {
  tokenId: string;
  tokenAddress: string;
  network: Network;
  whitelisted: boolean | undefined;
  onRampEnabled: boolean | undefined;
};

/**
 * Represents NFT data
 */

export type NftCollection = {
  nftCollectionId: string;
  collectionAddress: string;
  network: Network;
  whitelisted: boolean | undefined;
  ercType: 'ERC721' | 'ERC1155';
};
