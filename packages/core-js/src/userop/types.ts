import type { Address, Hash } from '@/types/core.js';
import type { PartialBy } from 'viem';

/**
 * Parameters for a token transfer intent.
 *
 * @property amount - Amount to send, in the smallest unit (e.g., gwei for ETH).
 * @property recipient - Wallet address of the recipient.
 * @property token - The token address for the transaction.
 * @property caip2Id - The network ID (e.g., Ethereum, Polygon).
 */
export type TokenTransferIntentParams = {
  amount: number | bigint;
  recipient: Address;
  token: Address | '';
  caip2Id: string;
};

/**
 * Parameters required for transferring an NFT.
 *
 * @property caip2Id - The network identifier, formatted as a CAIP network ID.
 * @property collectionAddress - The address of the NFT collection.
 * @property nftId - The unique identifier of the NFT. This can be a 32-bit address on Aptos or an integer on EVMs.
 * @property recipientWalletAddress - The wallet address of the recipient.
 * @property amount - The amount of NFTs to transfer, typically "1".
 * @property type - The type of NFT. For Aptos, this is 'nft'. For Solana, this is an empty string. Other chains may have different values.
 */
export type NFTTransferIntentParams = {
  caip2Id: string;
  collectionAddress: Address;
  nftId: string;
  recipientWalletAddress: Address;
  amount: number | bigint;
  nftType: 'ERC721' | 'ERC1155';
};

/**
 * Parameters for creating a new NFT collection
 *
 * @property caip2Id - Chain identifier in CAIP-2 format (e.g., "eip155:1" for Ethereum mainnet)
 * @property name - Name of the NFT collection
 * @property uri - URI pointing to collection metadata (typically IPFS or similar)
 * @property data - Additional collection metadata
 * @property data.attributes - JSON string containing collection attributes
 * @property data.symbol - Collection symbol (e.g., "BAYC" for Bored Ape Yacht Club)
 * @property data.type - Type of collection (e.g., "ERC721", "ERC1155")
 * @property data.description - Human-readable description of the collection
 */
export interface NftCreateCollectionParams {
  caip2Id: string;
  name: string;
  uri: string;
  data: {
    attributes: string;
    symbol: string;
    type: string;
    description: string;
  };
}

/**
 * Parameters for minting a new NFT within an existing collection
 *
 * @property caip2Id - Chain identifier in CAIP-2 format (e.g., "eip155:1" for Ethereum mainnet)
 * @property nftName - Name of the individual NFT being minted
 * @property collectionAddress - Contract address of the collection to mint the NFT in
 * @property uri - URI pointing to the NFT's metadata (typically IPFS or similar)
 * @property data - Additional NFT metadata
 * @property data.recipientWalletAddress - Wallet address that will receive the newly minted NFT
 * @property data.description - Human-readable description of the NFT
 * @property data.properties - Array of custom properties/traits for the NFT
 * @property data.properties[].name - Name of the property/trait
 * @property data.properties[].valueType - Data type of the value (e.g., "string", "number", "boolean")
 * @property data.properties[].value - Actual value of the property/trait
 */
export interface NftMintParams {
  caip2Id: string;
  nftName: string;
  collectionAddress: string;
  uri: string;
  data: {
    recipientWalletAddress: string;
    description: string;
    properties: Array<{
      name: string;
      valueType: string;
      value: string;
    }>;
  };
}

export type AptosFunctionArgumentTypes =
  | boolean
  | number
  | bigint
  | string
  | null
  | undefined
  | Uint8Array
  | ArrayBuffer
  | Array<AptosFunctionArgumentTypes>;

export interface AptosRawTransaction {
  function: string;
  typeArguments: string[];
  functionArguments: AptosFunctionArgumentTypes[];
}

export interface AptosRawTransactionIntentParams {
  caip2Id: string;
  transactions: AptosRawTransaction[];
}

/**
 * Parameters required for minting an NFT.
 *
 * @property caip2Id - The network identifier, formatted as a CAIP network ID.
 * @property type - The type of the NFT. For EVMs, this could be "ERC1155". For Aptos, this is 'nft'. For Solana, this is an empty string. Other chains may have different values.
 * @property collectionAddress - The address of the NFT collection.
 * @property quantity - The quantity of NFTs to mint, typically "1".
 * @property metadata - The metadata associated with the NFT.
 * @property metadata.uri - The URI pointing to the metadata of the NFT.
 * @property metadata.nftName - The name of the NFT.
 * @property metadata.description - A description of the NFT.
 */
export type NFTMintIntentParams = {
  caip2Id: string;
  type: string;
  collectionAddress: Address;
  quantity: string;
  metadata: {
    uri: string;
    nftName: string;
    description: string;
  };
};

export type EVMRawTransaction = {
  from: Address;
  to: Address;
  data: Hash;
  value: Hash;
};

export type EVMRawTransactionIntentParams = {
  caip2Id: string;
  transaction: Omit<PartialBy<EVMRawTransaction, 'data' | 'value'>, 'value'> & {
    value?: number | bigint;
  };
};
