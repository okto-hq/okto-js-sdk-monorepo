
import React, { useRef, useEffect, useCallback } from 'react';
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

// Simplified injected JavaScript for channel-based communication
const INJECTED_JAVASCRIPT = `
  (function() {
    // Initialize communication channels
    window.requestChannel = {
      postMessage: function(message) {
        console.log('[WebView] Sending request:', message);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(message);
        }
      }
    };

    window.launchChannel = {
      postMessage: function(message) {
        console.log('[WebView] Sending launch event:', message);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(message);
        }
      }
    };

    window.infoChannel = {
      postMessage: function(message) {
        console.log('[WebView] Sending info:', message);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(message);
        }
      }
    };

    // Response channel for receiving data from native
    window.responseChannel = function(response) {
      console.log('[WebView] Received response:', response);
      // This will be called by the native side to send responses
      const event = new CustomEvent('nativeResponse', { detail: response });
      window.dispatchEvent(event);
    };

    console.log('[WebView] Channel-based communication initialized');
  })();
  true;
`;

export const OnRampScreen = ({ route, navigation }: Props) => {
  const { url, tokenId, oktoClient, onClose, onSuccess, onError, onProgress } = route.params;

  const webViewRef = useRef<WebView>(null);
  const bridgeRef = useRef<WebViewBridge | null>(null);

  const handleSuccess = useCallback(
    (data?: string) => {
      console.log('[OnRampScreen] Success:', data);
      onSuccess?.(data || 'Transaction completed successfully');
      onClose();
    },
    [onSuccess, onClose],
  );

  const handleError = useCallback(
    (error: string) => {
      console.error('[OnRampScreen] Error:', error);
      onError?.(error);
      onClose();
    },
    [onError, onClose],
  );

  const handleClose = useCallback(() => {
    console.log('[OnRampScreen] Closing OnRamp screen');
    navigation.goBack();
  }, [navigation]);

  const handleProgress = useCallback(
    (progress: number) => {
      onProgress?.(progress);
    },
    [onProgress],
  );

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleClose();
        return true;
      },
    );
    return () => backHandler.remove();
  }, [handleClose]);

  // Initialize WebView bridge
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
  }, [tokenId, oktoClient, handleSuccess, handleError, handleClose, handleProgress]);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    console.log('[OnRampScreen] Received WebView message');
    bridgeRef.current?.handleMessage(event);
  }, []);

  const handleWebViewError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.error('[OnRampScreen] WebView error:', nativeEvent);
      handleError('Failed to load payment page. Please check your internet connection.');
    },
    [handleError],
  );

  const handleWebViewLoad = useCallback(() => {
    console.log('[OnRampScreen] WebView loaded successfully');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          onMessage={handleWebViewMessage}
          onError={handleWebViewError}
          onLoad={handleWebViewLoad}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="compatibility"
          style={styles.webView}
          allowsBackForwardNavigationGestures={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          startInLoadingState={true}
          allowsLinkPreview={false}
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