import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import type { TokenListingFilter } from '@/types/bff/tokens.js';

/**
 * Fetches the list of supported tokens from the backend.
 */
export async function getTokens(oc: OktoClient) {
  try {
    const response = await BffClientRepository.getSupportedTokens(oc);
    return response;
  } catch (error) {
    console.error('Error fetching supported tokens:', error);
    throw new Error('Failed to fetch supported tokens from the backend.');
  }
}

export async function getTokensForSwap(
  oc: OktoClient,
  filters: TokenListingFilter,
) {
  try {
    const response = await BffClientRepository.getTokensForSwap(oc, filters);
    return response;
  } catch (error) {
    console.error('Error fetching supported tokens for swap:', error);
    throw new Error(
      'Failed to fetch supported tokens for swap from the backend.',
    );
  }
}
