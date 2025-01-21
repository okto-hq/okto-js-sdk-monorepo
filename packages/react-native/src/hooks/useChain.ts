import { useOkto } from "./useOkto.js"

/**
 * Custom hook that provides chain-related functions from OktoClient.
 *
 * This hook uses the OktoClient instance to return functions that interact with blockchain chains.
 * It includes methods for fetching a list of available chains.
 *
 * @returns An object containing methods for fetching chain-related data:
 *   - getChains: Function to retrieve the list of available chains.
 */
export const useChain = () => {
  const oktoClient = useOkto();

  return {
    ...oktoClient.chain
  };
};
