export interface WhitelistedToken {
    id: string;
    tokenId: string;
    tokenAddress: string;
    vendorId: string;
    networkId: string;
    caipBlockchainId: string;
    whitelisted: boolean;
    onRampEnabled: boolean;
  }
  
  export interface WhitelistedCollection {
    id: string;
    nftCollectionId: string;
    collectionAddress: string;
    vendorId: string;
    networkId: string;
    caipBlockchainId: string;
    whitelisted: boolean;
  }

  