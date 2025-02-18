import { createContext, useContext } from 'react';
import { OktoClient } from './../core/index.js';

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
