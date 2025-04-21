import { useContext, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { OktoClient } from '../core/index.js';

import { createContext } from 'react';

export const OktoContext = createContext<OktoClient | null>(null);

/**
 * Custom hook to access the OktoClient's openWebView functionality
 *
 * @returns A function to open web view with the provided URL
 * @throws Error if used outside of OktoContext provider
 */
export const useOktoWebView = () => {
  const oktoClient = useContext(OktoContext);
  const navigation = useNavigation();

  if (!oktoClient) {
    throw new Error(
      'useOktoWebView must be used within an OktoContext.Provider',
    );
  }

  const openWebView = useCallback(
    (url: string) => {
      oktoClient.openWebView(url, navigation);
    },
    [oktoClient, navigation],
  );

  return openWebView;
};
