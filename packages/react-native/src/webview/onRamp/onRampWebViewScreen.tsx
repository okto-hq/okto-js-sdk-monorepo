import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { OnRampWebViewBridge } from './webViewBridge.js';
import { OnRampService } from './onRampService.js';
import type { OnrampCallbacks, OnRampParamList } from './types.js';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<OnRampParamList, 'OnRampScreen'>;

export const OnRampScreen = ({ route, navigation }: Props) => {
  const { url, tokenId, oktoClient, onClose, onSuccess, onError, onProgress } =
    route.params;

  const webViewRef = useRef<WebView>(null);
  const bridgeRef = useRef<OnRampWebViewBridge | null>(null);
  const onRampServiceRef = useRef<OnRampService | null>(null);

  const handleSuccess = useCallback(
    (data: any) => {
      console.log('OnRamp transaction successful:', data);
      onSuccess?.(data?.message || 'Transaction completed successfully');
      onClose();
    },
    [onSuccess, onClose],
  );

  const handleError = useCallback(
    (error: string) => {
      console.error('OnRamp transaction error:', error);
      onError?.(error);
      onClose();
    },
    [onError, onClose],
  );

  const handleClose = useCallback(() => {
    console.log('OnRamp screen closing');
    onClose();
  }, [onClose]);

  const handleProgress = useCallback(
    (progress: number) => {
      console.log('OnRamp progress:', progress);
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

  // Initialize services and bridge
  useEffect(() => {
    const callbacks: OnrampCallbacks = {
      onSuccess: handleSuccess,
      onError: handleError,
      onClose: handleClose,
      onProgress: handleProgress,
    };

    // Initialize OnRamp service
    onRampServiceRef.current = new OnRampService({}, oktoClient);

    // Create the bridge instance
    bridgeRef.current = new OnRampWebViewBridge(
      webViewRef,
      callbacks,
      onRampServiceRef.current,
      tokenId,
    );

    // Cleanup on unmount
    return () => {
      bridgeRef.current?.cleanup();
      bridgeRef.current = null;
      onRampServiceRef.current = null;
    };
  }, [
    tokenId,
    oktoClient,
    handleSuccess,
    handleError,
    handleClose,
    handleProgress,
  ]);

  // Handle WebView message events
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      console.log('KARAN :: handleWebViewMessage ', event.nativeEvent.data);
      if (bridgeRef.current) {
        console.log('KARAN :: handleWebViewMessage ', event.nativeEvent.data);
        bridgeRef.current.handleMessage(event);
        console.log('KARAN :: Bridge message handled:', event);
      }
    } catch (error) {
      console.error('KARAN :: Error in handleWebViewMessage', error);
      // Optionally call the error handler if defined
      // handleError?.('Failed to process WebView message');
    }
  }, []);

  // Handle WebView load completion
  const handleWebViewLoadEnd = useCallback(() => {
    console.log('OnRamp WebView loaded');
  }, []);

  // Handle WebView errors
  const handleWebViewError = useCallback(() => {
    const errorMessage =
      'Failed to load payment page. Please check your internet connection.';
    console.error('OnRamp WebView Error:', errorMessage);
    handleError(errorMessage);
  }, [handleError]);

  // Simplified injected JavaScript
  const injectedJavaScript = `
    (function() {
      window.ReactNativeWebView = window.ReactNativeWebView || {};
      
      window.sendToReactNative = function(message) {
      console.log('KARAN :: Sending message to React Native:', message);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        }
      };
      
      window.addEventListener('message', function(event) {
        console.log('KARAN :: Received message from React Native:', event.data);
        try {
           const parsedData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            window.sendToReactNative(parsedData);
            } catch (e) {
            console.warn('KARAN ::  Failed to parse message from React Native:', e);
        }
      });
      
      console.log('KARAN :: OnRamp WebView bridge ready');
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          onMessage={handleWebViewMessage}
          injectedJavaScript={injectedJavaScript}
          onLoadEnd={handleWebViewLoadEnd}
          onError={handleWebViewError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          style={styles.webView}
          allowsBackForwardNavigationGestures={false}
          bounces={false}
          scrollEnabled={true}
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
    paddingTop: 25,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
});
