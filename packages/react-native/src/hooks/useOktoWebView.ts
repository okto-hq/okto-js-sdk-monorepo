// src/hooks/useOktoAuthWebView.ts
import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Routes } from 'src/webview/types.js';
import type { StackNavigationProp } from '@react-navigation/stack';

type WebViewOptions = {
  title?: string;
  onAuthComplete?: (data: Record<string, any>) => void;
};

type RootStackParamList = {
  [Routes.AUTH_WEBVIEW]: {
    url: string;
    title?: string;
    onAuthComplete?: (data: Record<string, any>) => void;
  };
};

export const useOktoWebView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const openAuthWebView = useCallback(
    (url: string, options?: WebViewOptions) => {
      navigation.navigate(Routes.AUTH_WEBVIEW, {
        url,
        ...options,
      });
    },
    [navigation],
  );

  return { openAuthWebView };
};
