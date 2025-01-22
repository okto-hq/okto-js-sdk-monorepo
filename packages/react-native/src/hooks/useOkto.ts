import type { OktoClient } from '@okto-sdk/core-js';
import { useOktoContext } from '../context/OktoContext.js';

export function useOkto(): OktoClient {
  const { client } = useOktoContext();

  if (!client) {
    throw new Error('Okto client not initialized');
  }

  return client;
}
