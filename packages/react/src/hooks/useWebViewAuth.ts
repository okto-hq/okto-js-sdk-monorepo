import { useState, useCallback } from 'react';
import { useAuthWebView } from './useOkto.js';
import type { WebViewOptions } from 'src/webview/types.js';

export function useWebViewAuth() {
  const authWebView = useAuthWebView();
  const [isModalOpen, setModalOpen] = useState(false);

  const authenticate = useCallback(
    async (options: WebViewOptions = {}) => {
      if (!authWebView) {
        throw new Error('AuthWebView is not initialized.');
      }

      setModalOpen(true);

      try {
        const result = await authWebView.open(options);
        setModalOpen(false);
        return result;
      } catch (error) {
        setModalOpen(false);
        throw error;
      }
    },
    [authWebView],
  );

  return { isModalOpen, authenticate };
}