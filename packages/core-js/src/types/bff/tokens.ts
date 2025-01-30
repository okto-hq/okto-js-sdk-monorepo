import type { Network } from './common.js';

/**
 * Represents Token data
 */

export type Token = {
  address: string;
  caipId: string;
  symbol: string;
  image: string;
  name: string;
  shortName: string;
  id: string;
  groupId: string;
  isPrimary: boolean;
  networkId: string;
  networkName: string;
  isOnrampEnabled: boolean;
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
