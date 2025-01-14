// src/hooks/useToken.ts
import { useOktoClient } from "../context/OktoProvider";

export const useToken = () => {
  const oktoClient = useOktoClient();
  return {
    getTokens: oktoClient.token.getTokens,
    getNftCollections: oktoClient.token.getNftCollections,
  };
};
