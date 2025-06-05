import type { Token } from './bff/tokens.js';

export interface AddFundsData {
  walletAddress: string;
  walletBalance: string;
  tokenId: string;
  networkId: string;
  tokenName: string;
  chain: string;
  userId: string;
  email: string;
  countryCode: string;
  theme: string;
  app_version: string;
  screen_source: string;
  payToken: string;
  platform?: string;
  app?: string;
}

export interface CombinedToken {
  name: string;
  symbol: string;
  shortName: string;
  id: string;
  groupId: string;
  holdingsPriceUsdt: string;
  holdingsPriceInr: string;
  balance: string;
  networkId: string;
  isPrimary: boolean;
  tokenImage: string;
  networkName: string;
  walletAddress: string;
  chainId: string;
  email: string;
  userId: string;
  token?: Token;
}

export type WhitelistedToken = {
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
  onrampTokens: WhitelistedToken[];
  offrampTokens: WhitelistedToken[];
};

/**
 * Response structure for transaction token generation
 */
export type TransactionTokenResponse = {
  transactionToken: string;
};

export interface OnrampOptions {
  countryCode?: string;
  theme?: 'light' | 'dark';
  appVersion?: string;
  screenSource?: string;
}
