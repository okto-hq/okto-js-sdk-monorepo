import { useOkto } from './useOkto.js';

export const useAccount = () => {
  const oktoClient = useOkto();
  return oktoClient.account;
};
