import { useOkto } from './useOkto.js';

export const useAccount = () => {
  const client = useOkto();

  return {
    ...client.account,
  };
};
