import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import type {
  UserNFTBalance,
  UserPortfolioActivity,
  UserPortfolioData,
} from '@/types/bff/account.js';

/**
 * Retrieves the aggregated portfolio for the authenticated user.
 */
export async function getPortfolio(oc: OktoClient): Promise<UserPortfolioData> {
  try {
    return await BffClientRepository.getPortfolio(oc);
  } catch (error) {
    console.error('Failed to retrieve portfolio: ', error);
    throw error;
  }
}

/**
 * Retrieves the portfolio activity for the authenticated user from the BFF service.
 */
export async function getPortfolioActivity(
  oc: OktoClient,
): Promise<UserPortfolioActivity[]> {
  try {
    return await BffClientRepository.getPortfolioActivity(oc);
  } catch (error) {
    console.error('Failed to retrieve portfolio: ', error);
    throw error;
  }
}

/**
 * Retrieves the list of orders for the authenticated user.
 */
export async function getPortfolioNFT(
  oc: OktoClient,
): Promise<UserNFTBalance[]> {
  try {
    return await BffClientRepository.getPortfolioNft(oc);
  } catch (error) {
    console.error('Failed to retrieve orders: ', error);
    throw error;
  }
}
