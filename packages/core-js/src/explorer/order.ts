import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import type { Order } from '@/types/bff/account.js';

/**
 * Retrieves the list of orders for the authenticated user.
 */
export async function getOrdersHistory(oc: OktoClient): Promise<Order[]> {
  try {
    return await BffClientRepository.getOrders(oc);
  } catch (error) {
    console.error('Failed to retrieve orders: ', error);
    throw error;
  }
}
