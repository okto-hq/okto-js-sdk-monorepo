import { type OktoClientConfig } from '@okto_web3/core-js-sdk';
import { OktoClient } from '../core/index.js';
import type { ReactNode } from 'react';
import { OktoContext } from './OktoContext.js';

interface OktoProviderProps {
  config: OktoClientConfig;
  children: ReactNode;
}

export const OktoProvider = ({ config, children }: OktoProviderProps) => {
  const client = new OktoClient(config);

  return (
    <OktoContext.Provider value={{ client }}>{children}</OktoContext.Provider>
  );
};
