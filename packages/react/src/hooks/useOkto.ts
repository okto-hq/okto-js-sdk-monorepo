import type { OktoClient } from '../core/index.js';
import { useOktoContext } from '../context/OktoContext.js';

export function useOkto(): OktoClient {
  const { client } = useOktoContext();

  if (!client) {
    throw new Error('Okto client not initialized');
  }

  return client;
}

export function useAuthWebView() {
  const client = useOkto();
  return client['authWebView']; // Access the private `authWebView` instance
}
