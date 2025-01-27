import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import type { GetSupportedNetworksResponseData } from '@/types/index.js';

/**
 * Retrieves the list of supported networks.
 */
export async function getChains(
  oc: OktoClient,
): Promise<GetSupportedNetworksResponseData[]> {
  try {
    const supportedNetworks =
      await BffClientRepository.getSupportedNetworks(oc);
    return supportedNetworks;
  } catch (error) {
    console.error('Failed to retrieve supported networks:', error);
    throw new Error('Unable to fetch supported networks');
  }
}
