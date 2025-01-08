export type ChainType = 'EVM' | 'SVM' | 'APT';

// TODO(sparsh.a): This is a placeholder for the actual implementation
export type Address = string;

export type Network = {
  networkId: string;
  caipBlockchainId: string;
  name: string | undefined;
  sponsorshipEnabled: boolean | undefined;
  whitelisted: boolean | undefined;
  type: ChainType | undefined;
  onRampEnabled: boolean | undefined;
  gsnEnabled: boolean | undefined;
};

export type Wallet = {
  network: Network;
  address: Address;
};

export type Token = {
  tokenId: string;
  tokenAddress: string;
  network: Network;
  whitelisted: boolean | undefined;
  onRampEnabled: boolean | undefined;
};

export type NftCollection = {
  nftCollectionId: string;
  collectionAddress: string;
  network: Network;
  whitelisted: boolean | undefined;
  ercType: 'ERC721' | 'ERC1155';
};

export type NftMetadata = {
  uri: string;
  nftName: string;
  description: string;
};
