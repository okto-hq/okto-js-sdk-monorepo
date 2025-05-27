import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, BackHandler } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnRampService } from './onRampService.js';
import { WebViewBridge } from './webViewBridge.js';
import type { OnrampCallbacks, OnRampParamList } from './types.js';

type Props = NativeStackScreenProps<OnRampParamList, 'OnRampScreen'>;
type OnRampSuccessData = { message?: string };

const INJECTED_JAVASCRIPT = `
  (function() {
    // Initialize communication channels
    const channels = ['launchChannel', 'requestChannel', 'infoChannel'];
    
    channels.forEach(channel => {
      window[channel] = {
        postMessage: function(data) {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            channel: channel,
            data: data
          }));
        }
      };
    });

    // Response channel handler
    window.responseChannel = function(hostRes) {
      if (window.hostResponseCallbacks) {
        window.hostResponseCallbacks.forEach(cb => {
          try {
            cb(hostRes);
          } catch (error) {
            console.error('Error in response callback:', error);
          }
        });
      }
    };

    // Initialize callback registry
    window.hostResponseCallbacks = window.hostResponseCallbacks || [];
    
    window.registerResponseCallback = function(callback) {
      if (typeof callback === 'function') {
        window.hostResponseCallbacks.push(callback);
        return function() {
          const index = window.hostResponseCallbacks.indexOf(callback);
          if (index > -1) {
            window.hostResponseCallbacks.splice(index, 1);
          }
        };
      }
    };
    
    true;
  })();
`;

export const OnRampScreen = ({ route, navigation }: Props) => {
  const { url, tokenId, oktoClient, onClose, onSuccess, onError, onProgress } = route.params;
  const webViewRef = useRef<WebView>(null);
  const bridgeRef = useRef<WebViewBridge | null>(null);

  // Memoized callbacks
  const handleSuccess = useCallback((data: OnRampSuccessData) => {
    onSuccess?.(data?.message || 'Transaction completed');
    onClose();
  }, [onSuccess, onClose]);

  const handleError = useCallback((error: string) => {
    onError?.(error);
    onClose();
  }, [onError, onClose]);

  const handleClose = useCallback(() => {
    onClose?.();
    navigation.goBack();
  }, [onClose, navigation]);

  const handleProgress = useCallback((progress: number) => {
    onProgress?.(progress);
  }, [onProgress]);

  // Hardware back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => backHandler.remove();
  }, [handleClose]);

  // Initialize bridge
  useEffect(() => {
    const callbacks: OnrampCallbacks = {
      onSuccess: handleSuccess,
      onError: handleError,
      onClose: handleClose,
      onProgress: handleProgress,
    };

    const onRampService = new OnRampService({}, oktoClient);
    bridgeRef.current = new WebViewBridge(webViewRef, callbacks, onRampService, tokenId);

    return () => {
      bridgeRef.current?.cleanup();
    };
  }, [tokenId, oktoClient, handleSuccess, handleError, handleClose, handleProgress]);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    bridgeRef.current?.handleMessage(event);
  }, []);

  const handleWebViewError = useCallback(() => {
    handleError('Failed to load payment page. Please check your internet connection.');
  }, [handleError]);

  const handleWebViewHttpError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    handleError(`Payment page failed to load (${nativeEvent.statusCode}).`);
  }, [handleError]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          onMessage={handleWebViewMessage}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          onError={handleWebViewError}
          onHttpError={handleWebViewHttpError}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback
          style={styles.webView}
          bounces={false}
          startInLoadingState
          originWhitelist={['*']}
          overScrollMode="never"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});