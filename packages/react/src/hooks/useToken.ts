import { useOkto } from './useOkto.js';

export const useToken = () => {
  const oktoClient = useOkto();

  return oktoClient.token;
};
