import { useState, useCallback } from 'react';
import { useOkto } from './useOkto.js';
import type { WebViewOptions } from 'src/webview/types.js';

export function useOktoWebView() {
  const client = useOkto();
  const authWebView = client['authWebView'];
  const [isModalOpen, setModalOpen] = useState(false);

  const authenticate = useCallback(
    async (options: WebViewOptions = {}) => {
      if (!authWebView) {
        throw new Error('AuthWebView is not initialized.');
      } else {
        client['webViewManager']?.setOnCloseCallback(
          options.onClose ?? (() => {}),
        );
        client['webViewManager']?.setOnErrorCallback(
          options.onError ?? (() => {}),
        );
        client['webViewManager']?.setOnSuccessCallback(
          options.onSuccess ?? (() => {}),
        );
      }

      setModalOpen(true);

      try {
        const result = await authWebView.open({
          onSuccess(data) {
            options.onSuccess?.(data);
          },
          onClose() {
            options.onClose?.();
          },
          onError(error) {
            options.onError?.(error);
          },
        });
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
