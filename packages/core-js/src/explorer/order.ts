import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import type { Order, OrderFilterRequest } from '@/types/bff/account.js';

/**
 * Retrieves the list of orders for the authenticated user.
 */
export async function getOrdersHistory(
  oc: OktoClient,
  filters?: OrderFilterRequest,
): Promise<Order[]> {
  try {
    return await BffClientRepository.getOrders(oc, filters);
  } catch (error) {
    console.error('Failed to retrieve orders:', error);
    throw new Error('Failed to retrieve orders. Please try again later.');
  }
}
