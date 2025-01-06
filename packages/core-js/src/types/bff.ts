// Get type of response data

export type GetSupportedNetworksResponseData = {
  caip_id: string;
  network_name: string;
  chain_id: string;
  logo: string;
};

/**
 * Represents the user portfolio data.
 */
export type UserPortfolioData = {
  /**
   * Aggregated data of the user's holdings.
   */
  aggregated_data: {
    holdings_count: string;
    holdings_price_inr: string;
    holdings_price_usdt: string;
    total_holding_price_inr: string;
    total_holding_price_usdt: string;
  };
  /**
   * Array of group tokens.
   */
  group_tokens: Array<{
    id: string;
    name: string;
    symbol: string;
    short_name: string;
    token_image: string;
    token_address: string;
    group_id: string;
    network_id: string;
    precision: string;
    network_name: string;
    is_primary: boolean;
    balance: string;
    holdings_price_usdt: string;
    holdings_price_inr: string;
    aggregation_type: string;
    /**
     * Array of tokens within the group.
     */
    tokens: Array<{
      id: string;
      name: string;
      symbol: string;
      short_name: string;
      token_image: string;
      token_address: string;
      network_id: string;
      precision: string;
      network_name: string;
      is_primary: boolean;
      balance: string;
      holdings_price_usdt: string;
      holdings_price_inr: string;
    }>;
  }>;
};

/**
 * Represents a user's portfolio activity.
 */
export type UserPortfolioActivity = {
  symbol: string;
  image: string;
  name: string;
  short_name: string;
  id: string;
  group_id: string;
  description: string;
  quantity: string;
  order_type: string;
  transfer_type: string;
  status: string;
  timestamp: number;
  tx_hash: string;
  network_id: string;
  network_name: string;
  network_explorer_url: string;
  network_symbol: string;
  caip_id: string;
};

/**
 * Represents the response data for a user's portfolio activity.
 * 
 * @property {number} count - The total number of activities.
 * @property {UserPortfolioActivity[]} activity - An array of user portfolio activities.
 */
export type UserPortfolioActivityResponse = {
  count: number;
  activity: UserPortfolioActivity[];
};

/**
 * Represents a user's NFT balance.
 */
export type UserNFTBalance = {
  collection_id: string;
  network_id: string;
  caip_id: string;
  network_name: string;
  entity_type: string;
  collection_address: string;
  collection_name: string;
  nft_id: string;
  image: string;
  quantity: string;
  token_uri: string;
  description: string;
  nft_name: string;
  explorer_smart_contract_url: string;
  collection_image: string;
};

/**
 * Represents the response data for a user's NFT balances.
 * 
 * @property {number} count - The total number of NFT balances.
 * @property {UserNFTBalance[]} details - An array of user NFT balances.
 */
export type UserNFTBalanceResponse = {
  count: number;
  details: UserNFTBalance[];
};

/**
 * Represents an order.
 */
export type Order = {
  downstream_transaction_hash: string[];
  transaction_hash: string;
  status: string;
  intent_id: string;
  intent_type: string;
  network_name: string;
  caip_id: string;
  details: {
    recipientWalletAddress: string;
    networkId: string;
    tokenAddress: string;
    amount: string;
  };
};

/**
 * Represents the details of an NFT order.
 */
export type NFTOrderDetails = {
  job_id: string;
  status: string;
  order_type: string;
  network_id: string;
  created_at: string;
  updated_at: string;
};