import { useOkto } from './useOkto.js';

export const useToken = () => {
  const client = useOkto();

  return {
    ...client.token,
  };
};
