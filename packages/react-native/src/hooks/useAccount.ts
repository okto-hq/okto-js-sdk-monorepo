import { useOktoClient } from "../context/OktoProvider";

/**
 * Custom hook that provides account-related functions from OktoClient.
 *
 * This hook uses the OktoClient instance to return functions that interact with the user's account.
 * It includes methods for retrieving account information, portfolio details, and order history.
 *
 * @returns An object containing methods for accessing account-related data:
 *   - getAccount: Function to get account details.
 *   - getPortfolio: Function to get portfolio details.
 *   - getOrdersHistory: Function to get the order history.
 */
export const useAccount = () => {
  const oktoClient = useOktoClient();
  return {
    getAccount: oktoClient.account.getAccount, 
    getPortfolio: oktoClient.account.getPortfolio,
    getOrdersHistory: oktoClient.account.getOrdersHistory,
  };
};
