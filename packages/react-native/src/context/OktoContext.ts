import { OktoClient } from '@okto-sdk/core-js';
import { createContext, useContext } from 'react';

interface OktoContextType {
  client: OktoClient | null;
}

export const OktoContext = createContext<OktoContextType>({ client: null });

export function useOktoContext(): OktoContextType {
  const context = useContext(OktoContext);
  if (!context) {
    throw new Error('useOktoContext must be used within an OktoProvider');
  }
  return context;
}
