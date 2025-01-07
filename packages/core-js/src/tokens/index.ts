import GatewayClientRepository from '@/api/gateway.js';
import type { WhitelistedToken, WhitelistedCollection } from '@/types/gateway/token.js';

class Token {
    
 // -------------------- Public Methods -------------------- //
    
  public static async getTokens(): Promise<WhitelistedToken[]> {  //to retrieve a list of tokens that are whitelisted for the current vendor
    try { 
      const tokens = await GatewayClientRepository.getWhitelistedTokens();
      return tokens;
    } catch (error) {
      console.error('Error fetching whitelisted tokens:', error);
      throw new Error('Failed to fetch whitelisted tokens');
    }
  }

  public static async getNftCollections(): Promise<WhitelistedCollection[]> { // to retrieve a list of NFT collections that are whitelisted for the current vendor.
    try {
      const collections = await GatewayClientRepository.getWhitelistedCollections();
      return collections;
    } catch (error) {
      console.error('Error fetching whitelisted NFT collections:', error);
      throw new Error('Failed to fetch whitelisted NFT collections');
    }
  }
}

export default Token;
