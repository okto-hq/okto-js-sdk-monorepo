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
export type TokenEntity = {
  id: string;
  entityType: string;
  details: {
    address: string;
    chain_id: string;
    decimals: string;
    name: string;
    symbol: string;
    logo: string;
    price: string;
    network_name: string;
    is_active: boolean;
    is_tradable: boolean;
    group_id?: string;
    is_primary?: boolean;
    tags?: string[];
    total_supply?: string;
    type?: string;
    age?: number;
    priority?: number;
    fdv?: number;
    price_change_24h?: number;
    price_vol_data?: Record<string, unknown>;
    token_rank?: number;
    category?: string[];
    [key: string]:
      | string
      | number
      | boolean
      | string[]
      | Record<string, unknown>
      | undefined;
  };
};

/**
 * Parameters for token listing requests
 */
export type TokenListingParams = {
  identifier: string;
  caip2_ids?: string[];
  searchText?: string;
};

/**
 * Options for the getTokensForSwap method
 */
export type TokenListingFilter = {
  type: 'discovery' | 'network_filter' | 'search';
  networks?: string[]; // Networks in caip2 format (e.g., "eip155:222")
  searchText?: string;
};
