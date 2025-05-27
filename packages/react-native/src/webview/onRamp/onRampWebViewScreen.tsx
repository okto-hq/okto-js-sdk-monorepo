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
    window.ReactNativeWebView = window.ReactNativeWebView || {};
    
    // Function to send messages from WebView to React Native
    window.sendToReactNative = function(message) {
      console.log('[WebView -> React Native] Sending message:', message);
      if (window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    };
    
    // Handle responses from React Native (don't echo them back!)
    window.addEventListener('message', function(event) {
      console.log('[React Native -> WebView] Received response:', event.data);
      try {
        const parsedData = typeof event.data === 'string' 
          ? JSON.parse(event.data) 
          : event.data;
        
        // Process the response data here instead of sending it back
        // This is where you'd handle responses to your data requests
        if (parsedData.type === 'data' && parsedData.response) {
          // Handle data responses
          window.handleDataResponse && window.handleDataResponse(parsedData);
        }
      } catch (e) {
        console.error('[WebView] Failed to parse response from React Native:', e);
      }
    });

    // Log when the script is injected
    console.log('[WebView] Bridge script initialized');
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
    onClose();
  }, [onClose]);

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
