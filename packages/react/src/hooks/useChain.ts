import { useOkto } from './useOkto.js';

export const useChain = () => {
  const client = useOkto();

  return {
    ...client.chain,
  };
};
