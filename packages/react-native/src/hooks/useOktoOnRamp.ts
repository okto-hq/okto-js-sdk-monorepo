import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useOkto } from './useOkto.js';
import type { OnrampOptions } from '@okto_web3/core-js-sdk/types';

interface OnRampHookOptions extends OnrampOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

/**
 * Custom hook to access the OktoClient's openOnRamp functionality
 *
 * @returns A function to open onramp with the provided token ID and options
 */
export function useOktoOnRamp() {
  const oktoClient = useOkto();
  const navigation = useNavigation();

  /**
   * Opens the OnRamp screen for purchasing tokens
   * @param tokenId The ID of the token to purchase
   * @param options Optional configuration for the onramp experience
   */
  const openOnRamp = useCallback(
    async (tokenId: string, options: OnRampHookOptions = {}) => {
      try {
        await oktoClient.openOnRamp(navigation, tokenId, options);
      } catch (error) {
        console.error('[useOktoOnRamp] Error opening onramp:', error);
        // If no error handler is provided, re-throw the error
        if (!options.onError) {
          throw error;
        }
      }
    },
    [oktoClient, navigation],
  );

  return openOnRamp;
}