import { OktoClient } from '@okto_web3/core-js-sdk';
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
