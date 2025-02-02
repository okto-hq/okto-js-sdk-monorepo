import type { Address, Hash } from '@/types/core.js';
import type { PartialBy } from 'viem';

/**
 * Parameters for a token transfer intent.
 *
 * @property amount - Amount to send, in the smallest unit (e.g., gwei for ETH).
 * @property recipient - Wallet address of the recipient.
 * @property token - The token address for the transaction.
 * @property chain - The network ID (e.g., Ethereum, Polygon).
 */
export type TokenTransferIntentParams = {
  amount: number | bigint;
  recipient: Address;
  token: Address | '';
  chain: string;
};

/**
 * Parameters required for transferring an NFT.
 *
 * @property networkId - The network identifier, formatted as a CAIP network ID.
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
 * Parameters required for creating an NFT collection.
 *
 * @property networkId - The network identifier, formatted as a CAIP network ID.
 * @property name - The name of the NFT collection.
 * @property description - A description of the NFT collection.
 * @property metadataUri - The URI pointing to the metadata of the NFT collection.
 * @property symbol - The symbol representing the NFT collection.
 * @property type - The type of the NFT collection. For EVMs, this could be "1155".
 */
export type NFTCollectionCreationIntentParams = {
  networkId: string;
  name: string;
  description: string;
  metadataUri: string;
  symbol: string;
  type: string;
};

/**
 * Parameters required for minting an NFT.
 *
 * @property networkId - The network identifier, formatted as a CAIP network ID.
 * @property type - The type of the NFT. For EVMs, this could be "ERC1155". For Aptos, this is 'nft'. For Solana, this is an empty string. Other chains may have different values.
 * @property collectionAddress - The address of the NFT collection.
 * @property quantity - The quantity of NFTs to mint, typically "1".
 * @property metadata - The metadata associated with the NFT.
 * @property metadata.uri - The URI pointing to the metadata of the NFT.
 * @property metadata.nftName - The name of the NFT.
 * @property metadata.description - A description of the NFT.
 */
export type NFTMintIntentParams = {
  networkId: string;
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

export type RawTransactionIntentParams = {
  networkId: string;
  transaction: Omit<PartialBy<EVMRawTransaction, 'data' | 'value'>, 'value'> & {
    value?: number | bigint;
  };
};
