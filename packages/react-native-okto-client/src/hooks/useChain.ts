// src/hooks/useChain.ts
import { useOktoClient } from "../context/OktoProvider";

export const useChain = () => {
  const oktoClient = useOktoClient();
  return {
    getChains: oktoClient.chain.getChains,
  };
};
