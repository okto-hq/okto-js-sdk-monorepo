import { useOkto } from './useOkto.js';

export const useChain = () => {
  const oktoClient = useOkto();

  return oktoClient.chain;
};
