import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';

/**
 * Fetches NFT collection details from the backend.
 */
// TODO: Implement the function to fetch NFT collection details using /orders with a filter.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getNftCollections(oc: OktoClient) {
  try {
    const response = await BffClientRepository.getNftOrderDetails(oc);
    return response;
  } catch (error) {
    console.error('Error fetching NFT collections:', error);
    throw new Error('Failed to fetch NFT collections from the backend.');
  }
}
