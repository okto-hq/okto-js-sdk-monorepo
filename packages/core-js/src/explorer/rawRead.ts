import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import type {
  ReadContractPayload,
  ReadContractResponse,
} from '@/types/index.js';

/**
 * Reads contract data via the BFF API.
 *
 * @param oc - The OktoClient instance.
 * @param requestBody - The contract read request.
 * @returns The response containing contract data.
 * @throws Error if the read fails.
 */
export async function rawRead(
  oc: OktoClient,
  requestBody: ReadContractPayload,
): Promise<ReadContractResponse> {
  try {
    const response = await BffClientRepository.rawRead(oc, requestBody);

    if (!response || response.status === 'error') {
      throw new Error('Failed to read contract data');
    }

    return response;
  } catch (error) {
    console.error('Error reading contract:', error);
    throw new Error('Failed to read contract data from the backend.');
  }
}
