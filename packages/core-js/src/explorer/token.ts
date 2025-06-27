import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import type { TokenListingFilter } from '@/types/bff/tokens.js';
import type { SupportedRampTokensResponse } from '@/types/onramp.js';

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

/**
 * Fetches a transaction token for ramp operations.
 */
export async function generateTransactionToken(
  oc: OktoClient,
): Promise<string> {
  try {
    const token = await BffClientRepository.generateTransactionToken(oc);
    return token;
  } catch (error) {
    console.error('Error generating transaction token:', error);
    throw new Error('Failed to generate transaction token.');
  }
}

/**
 * Fetches supported ramp tokens from the backend.
 * @param oc OktoClient instance
 * @param countryCode Country code to filter tokens (e.g., 'IN')
 * @param side Transaction side ('onramp' or 'offramp')
 */
export async function getSupportedRampTokens(
  oc: OktoClient,
  countryCode: string,
  side: 'onramp' | 'offramp',
): Promise<SupportedRampTokensResponse> {
  try {
    const response = await BffClientRepository.getSupportedRampTokens(
      oc,
      countryCode,
      side,
    );
    return response;
  } catch (error) {
    console.error('Error fetching supported ramp tokens:', error);
    throw new Error('Failed to fetch supported ramp tokens from the backend.');
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
