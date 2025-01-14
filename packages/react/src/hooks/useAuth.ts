import { useOkto } from './useOkto.js';

export function useAuth() {
  const client = useOkto();

  // TODO: Implement isReady instead of throwing an error

  // TODO: Implement all the methods individually
  return {
    ...client.auth,
  };
}
