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
type OnRampSuccessData = { message?: string };

const INJECTED_JAVASCRIPT = `
(function() {
  // Create the bridge if it doesn't exist
  window.ReactNativeWebView = window.ReactNativeWebView || {
    postMessage: function(data) {
      window.sendToReactNative(data);
    }
  };

  // Function to send messages to React Native
  window.sendToReactNative = function(message) {
    try {
      if (typeof message !== 'string') {
        message = JSON.stringify(message);
      }
      if (window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(message);
      }
    } catch (error) {
      console.error('[WebView] Error sending message to React Native:', error);
    }
  };

  // Function to handle messages from React Native
  window.handleReactNativeMessage = function(data) {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsedData && typeof parsedData === 'object') {
        // Dispatch a custom event with the parsed data
        const event = new CustomEvent('reactNativeMessage', { detail: parsedData });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('[WebView] Error parsing message from React Native:', error);
    }
  };

  // Listen for messages from React Native
  document.addEventListener('message', function(event) {
    window.handleReactNativeMessage(event.data);
  });

  // Fallback for Android
  window.addEventListener('message', function(event) {
    // Filter out other message events that might come from other sources
    if (event.data && typeof event.data === 'string' && event.data.startsWith('{')) {
      window.handleReactNativeMessage(event.data);
    }
  });

  // Log initialization
  console.log('[WebView] Bridge initialized successfully');
})();
true;
`;

export const OnRampScreen = ({ route, navigation }: Props) => {
  console.log('[OnRampScreen] Initializing with route params:', route.params);
  const { url, tokenId, oktoClient, onClose, onSuccess, onError, onProgress } =
    route.params;

  const webViewRef = useRef<WebView>(null);
  const bridgeRef = useRef<WebViewBridge | null>(null);

  console.log('[OnRampScreen] WebView and Bridge refs created');

  const handleSuccess = useCallback(
    (data: OnRampSuccessData) => {
      console.log('[OnRampScreen] Success callback triggered with data:', data);
      onSuccess?.(data?.message || 'Transaction completed successfully');
      onClose();
    },
    [onSuccess, onClose],
  );

  // const navigateBack = () => {
  //   if (onClose) {
  //     onClose();
  //   }
  //   navigation.goBack();
  // };

  const handleError = useCallback(
    (error: string) => {
      console.error('[OnRampScreen] Error callback triggered:', error);
      onError?.(error);
      onClose();
    },
    [onError, onClose],
  );

  const handleClose = useCallback(() => {
    console.log('[OnRampScreen] Close callback triggered');
    if (onClose) {
        onClose();
    }
    navigation.goBack();
}, [onClose, navigation]);

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
    console.log(
      '[OnRampScreen] Received message from WebView:',
      event.nativeEvent.data,
    );
    bridgeRef.current?.handleMessage(event);
  }, []);

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
