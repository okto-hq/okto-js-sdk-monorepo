import BffClientRepository from '@/api/bff.js';

class Token {
  /**
   * Fetches the list of supported tokens from the backend.
   * Uses the BFF client repository to retrieve data.
   *
   * @returns {Promise<Array>} A promise that resolves to an array of supported tokens.
   * @throws {Error} If the request to fetch supported tokens fails.
   */
  async getTokens() {
    try {
      const response = await BffClientRepository.getSupportedTokens();
      return response;
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      throw new Error('Failed to fetch supported tokens from the backend.');
    }
  }

  /**
   * Fetches NFT collection details from the backend.
   * Uses the BFF client repository to retrieve data.
   *
   * @returns {Promise<Array>} A promise that resolves to an array of NFT collection details.
   * @throws {Error} If the request to fetch NFT collections fails.
   */
  async getNftCollections() {
    try {
      const response = await BffClientRepository.getNftOrderDetails();
      return response;
    } catch (error) {
      console.error('Error fetching NFT collections:', error);
      throw new Error('Failed to fetch NFT collections from the backend.');
    }
  }
}

export default Token;
