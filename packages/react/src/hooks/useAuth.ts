import { useOkto } from './useOkto.js';

export const useAuth = () => {
  const oktoClient = useOkto();

  return oktoClient.auth;
};

