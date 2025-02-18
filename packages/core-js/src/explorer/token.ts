import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';

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
