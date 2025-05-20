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
  caip2Id: string;
  networkName: string;
  isOnrampEnabled: boolean;
};

/**
 * Represents GSN Token data
 */

export interface  GSNToken {
	caip2Id :string;
	address :string;   
	amount:string;       
	amountInUSDT :string;
}


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
