import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import type { INTENT_TYPE, Order, STATUS_TYPE } from '@/types/bff/account.js';

/**
 * Retrieves the list of orders for the authenticated user.
 */
export async function getOrdersHistory(
  oc: OktoClient,
  filters? : {
    intentId?: string;
    status?: STATUS_TYPE;
    intentType?: INTENT_TYPE;
  },
): Promise<Order[]> {
  try {
    return await BffClientRepository.getOrders(oc, filters);
  } catch (error) {
    console.error('Failed to retrieve orders: ', error);
    throw error;
  }
}
