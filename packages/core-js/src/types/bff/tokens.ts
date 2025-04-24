import type { Network } from './common.js';

export type TokenListingIdentifier =
  | 'active_tradable_tokens_v1'
  | 'active_tradable_tokens_by_caip2_ids_v1'
  | 'searchable_tokens_v1';

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
 * Represents NFT data
 */

export type NftCollection = {
  nftCollectionId: string;
  collectionAddress: string;
  network: Network;
  whitelisted: boolean | undefined;
  ercType: 'ERC721' | 'ERC1155';
};

/**
 * Represents Token data for SWAP
 */

export type TradableToken = {
  address: string;
  caip_id: string;
  symbol: string;
  image: string;
  name: string;
  short_name: string;
  id: string;
  group_id: string;
  is_primary: boolean;
  network_id: string;
  network_name: string;
  decimals: string;
  precision: string;
  price?: string;
  price_change_24h?: number;
};

/**
 * Updated TokenListingFilter using the TokenListingIdentifier enum
 */
export type TokenListingFilter = {
  identifier: TokenListingIdentifier;
  page?: number;
  size?: number;
  caip2_ids?: string[];
  searchText?: string;
};
