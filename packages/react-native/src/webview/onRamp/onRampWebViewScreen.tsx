import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { WebViewBridge } from './webViewBridge.js';
import { OnRampService } from './onRampService.js';
import type { OnrampCallbacks, OnRampParamList } from './types.js';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<OnRampParamList, 'OnRampScreen'>;
type OnRampSuccessData = { message?: string };

const INJECTED_JAVASCRIPT = `
  (function() {
    function waitForBridge() {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        initializeBridge();
      } else {
        setTimeout(waitForBridge, 100);
      }
    }

    function initializeBridge() {
      function sendMessage(msg) {
        try {
          const stringifiedMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
          window.ReactNativeWebView.postMessage(stringifiedMsg);
        } catch (e) {
          console.error('Error sending message to React Native:', e);
        }
      }

      window.ReactNativeBridge = {
        postMessage: sendMessage
      };

      // Notify native that bridge is ready
      sendMessage({
        type: 'bridgeReady',
        message: 'Bridge initialized'
      });
    }

    // Start waiting for the bridge to be ready
    waitForBridge();
  })();
`;

export const OnRampScreen = ({ route, navigation }: Props) => {
  const { url, tokenId, oktoClient, onClose, onSuccess, onError, onProgress } = route.params;
  const [isWebViewReady, setIsWebViewReady] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const bridgeRef = useRef<WebViewBridge | null>(null);

  const handleSuccess = useCallback(
    (data: OnRampSuccessData) => {
      onSuccess?.(data?.message || 'Transaction completed successfully');
      onClose?.();
    },
    [onSuccess, onClose],
  );

  const handleError = useCallback(
    (error: string) => {
      onError?.(error);
      onClose?.();
    },
    [onError, onClose],
  );

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleProgress = useCallback(
    (progress: number) => {
      onProgress?.(progress);
    },
    [onProgress],
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true;
      },
    );
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    const callbacks: OnrampCallbacks = {
      onSuccess: handleSuccess,
      onError: handleError,
      onClose: handleClose,
      onProgress: handleProgress,
    };

    const onRampService = new OnRampService({}, oktoClient);
    bridgeRef.current = new WebViewBridge(
      webViewRef,
      callbacks,
      onRampService,
      tokenId,
    );

    return () => {
      bridgeRef.current?.cleanup();
      bridgeRef.current = null;
    };
  }, [
    tokenId,
    oktoClient,
    handleSuccess,
    handleError,
    handleClose,
    handleProgress,
  ]);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    if (!isWebViewReady) {
      setTimeout(() => handleWebViewMessage(event), 100);
      return;
    }
    bridgeRef.current?.handleMessage(event);
  }, [isWebViewReady]);

  const handleWebViewError = useCallback(() => {
    handleError(
      'Failed to load payment page. Please check your internet connection.',
    );
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
          onLoadEnd={() => setIsWebViewReady(true)}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback
          style={styles.webView}
          allowsBackForwardNavigationGestures={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          startInLoadingState
          allowsLinkPreview={false}
          cacheEnabled={true}
          thirdPartyCookiesEnabled={true}
          renderToHardwareTextureAndroid={true}
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
    paddingTop: 25,
  },
  webView: {
    flex: 1,
  },
});