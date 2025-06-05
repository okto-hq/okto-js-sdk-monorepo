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
export interface GSNToken {
  caip2Id: string;
  address: string;
  amount: string;
  amountInUSDT: string;
}

/**
 * Represents Token data for SWAP
 */
export type TokenEntity = {
  id: string;
  entityType: string;
  details: {
    address: string;
    chainId: string;
    decimals: string;
    name: string;
    symbol: string;
    logo: string;
    price: string;
    networkName: string;
    isActive: boolean;
    isTradable: boolean;
    groupId?: string;
    isPrimary?: boolean;
    tags?: string[];
    totalSupply?: string;
    type?: string;
    age?: number;
    priority?: number;
    fdv?: number;
    priceChange_24h?: number;
    priceVolData?: Record<string, unknown>;
    tokenRank?: number;
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
 * Represents GSN Token data
 */
export interface GSNToken {
  caip2Id: string;
  address: string;
  amount: string;
  amountInUSDT: string;
}

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
