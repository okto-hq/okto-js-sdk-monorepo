import BffClientRepository from "@/api/bff.js";
import type { GetSupportedNetworksResponseData } from "@/types/bff/chains.js";

class Chain {
  /**
   * Retrieves the list of supported networks.
   * Uses the BFF client repository to fetch supported networks from the backend.
   *
   * @returns {Promise<GetSupportedNetworksResponseData[]>} A promise that resolves to an array of supported networks.
   * @throws {Error} If the request to fetch supported networks fails.
   */
  public async getChains(): Promise<
    GetSupportedNetworksResponseData[]
  > {
    try {
      const supportedNetworks =
        await BffClientRepository.getSupportedNetworks();
      return supportedNetworks;
    } catch (error) {
      console.error('Failed to retrieve supported networks:', error);
      throw new Error('Unable to fetch supported networks');
    }
  }
}

export default Chain;
