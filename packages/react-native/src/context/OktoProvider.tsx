// src/providers/OktoProvider.tsx
import React, { createContext, useContext } from 'react';
import {OktoClient} from '@okto-sdk/core-js'; 

const OktoContext = createContext<OktoClient | null>(null);

export const OktoProvider: React.FC<{
  config: { environment: string; vendorPrivKey: string };
  children: React.ReactNode;
}> = ({ config, children }) => {
  const oktoClient = new OktoClient(config);

  return (
    <OktoContext.Provider value={oktoClient}>
      {children}
    </OktoContext.Provider>
  );
};

export const useOktoClient = () => {
  const context = useContext(OktoContext);
  if (!context) {
    throw new Error('useOktoClient must be used within an OktoProvider');
  }
  return context;
};
