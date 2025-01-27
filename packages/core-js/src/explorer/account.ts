import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import type { Wallet } from '@/types/bff/account.js';

/**
 * Retrieves the list of wallets for the authenticated user.
 */
export async function getAccount(oc: OktoClient): Promise<Wallet[]> {
  try {
    return await BffClientRepository.getWallets(oc);
  } catch (error) {
    console.error('Failed to retrieve wallets: ', error);
    throw error;
  }
}
