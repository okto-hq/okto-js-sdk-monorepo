// OnRampScreen.js
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
import type { OnrampCallbacks, OnRampParamList, OnRampToken } from './types.js';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<OnRampParamList, 'OnRampScreen'>;

export const OnRampScreen = ({ route, navigation }: Props) => {
  const { 
    url, 
    tokenId, 
    oktoClient, 
    onClose, 
    onSuccess, 
    onError, 
    onProgress,
    onRampToken // Add this parameter to pass the token data
  } = route.params;

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

  const handleClose = useCallback((forwardToRoute?: string) => {
    console.log('OnRamp screen closing, forwardToRoute:', forwardToRoute);
    onClose(forwardToRoute);
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

    // Initialize OnRamp service with the token data
    onRampServiceRef.current = new OnRampService({}, oktoClient, onRampToken);

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
  }, [tokenId, oktoClient, onRampToken, handleSuccess, handleError, handleClose, handleProgress]);

  // Handle WebView message events
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      console.log('WebView message received:', event.nativeEvent.data);
      if (bridgeRef.current) {
        bridgeRef.current.handleMessage(event);
      }
    } catch (error) {
      console.error('Error in handleWebViewMessage:', error);
      handleError?.('Failed to process WebView message');
    }
  }, [handleError]);

  // Handle WebView load completion
  const handleWebViewLoadEnd = useCallback(() => {
    console.log('OnRamp WebView loaded successfully');
  }, []);

  // Handle WebView errors
  const handleWebViewError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const errorMessage = `Failed to load payment page: ${nativeEvent.description || 'Unknown error'}`;
    console.error('OnRamp WebView Error:', errorMessage);
    handleError(errorMessage);
  }, [handleError]);

  // Injected JavaScript to establish communication bridge
  const injectedJavaScript = `
    (function() {
      console.log('OnRamp WebView bridge initializing...');
      
      // Ensure ReactNativeWebView exists
      window.ReactNativeWebView = window.ReactNativeWebView || {};
      
      // Function to send messages to React Native
      window.sendToReactNative = function(message) {
        console.log('Sending message to React Native:', message);
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            const messageString = typeof message === 'string' ? message : JSON.stringify(message);
            window.ReactNativeWebView.postMessage(messageString);
          } else {
            console.error('ReactNativeWebView.postMessage not available');
          }
        } catch (error) {
          console.error('Error sending message to React Native:', error);
        }
      };
      
      // Listen for messages from React Native
      window.addEventListener('message', function(event) {
        console.log('Received message in WebView:', event.data);
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          // Handle incoming messages from React Native if needed
          // This could trigger specific actions in your web application
        } catch (e) {
          console.warn('Failed to parse message from React Native:', e);
        }
      });
      
      // Override the default message posting if your web app uses a specific method
      // This ensures compatibility with your existing web implementation
      const originalPostMessage = window.postMessage;
      window.postMessage = function(message, targetOrigin) {
        console.log('Web app posting message:', message);
        
        // Send to React Native
        window.sendToReactNative(message);
        
        // Also call original postMessage if needed
        if (originalPostMessage && targetOrigin) {
          originalPostMessage.call(window, message, targetOrigin);
        }
      };
      
      console.log('OnRamp WebView bridge ready');
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
          // Additional props for better compatibility
          cacheEnabled={false}
          incognito={false}
          sharedCookiesEnabled={true}
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