import { useOkto} from "./useOkto.js";

/**
 * Custom hook that provides token and NFT collection-related functions from OktoClient.
 *
 * This hook uses the OktoClient instance to return functions that interact with tokens and NFT collections.
 * It includes methods for fetching a list of available tokens and NFT collections.
 *
 * @returns An object containing methods for fetching token and NFT collection-related data:
 *   - getTokens: Function to retrieve the list of available tokens.
 *   - getNftCollections: Function to retrieve the list of NFT collections.
 */
export const useToken = () => {
  const oktoClient = useOkto();

  return oktoClient.token;
};
