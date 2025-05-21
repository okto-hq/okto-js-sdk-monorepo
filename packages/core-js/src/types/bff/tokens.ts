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

export type RampToken = {
  name: string;
  shortName: string;
  logo: string;
  tokenId: string;
  tokenGroupId: string;
  networkId: string;
  rank: number;
  networkName: string;
  address: string;
  chainId: string | number;
  precision: number;
};

/**
 * Response structure for supported ramp tokens
 */
export type SupportedRampTokensResponse = {
  onrampTokens: RampToken[];
  offrampTokens: RampToken[];
};

/**
 * Response structure for transaction token generation
 */
export type TransactionTokenResponse = {
  transactionToken: string;
};
