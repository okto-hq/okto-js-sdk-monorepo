import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useOkto } from './useOkto.js';

/**
 * Custom hook to access the OktoClient's openWebView functionality
 * 
 * @returns A function to open web view with the provided URL
 */
export function useOktoWebView() {
  const oktoClient = useOkto();
  const navigation = useNavigation();

  /**
   * Opens a URL in the WebView
   * @param url The URL to open in the WebView
   */
  const openWebView = useCallback(
    (url: string) => {
      oktoClient.openWebView(url, navigation);
    },
    [oktoClient, navigation]
  );

  return openWebView;
}