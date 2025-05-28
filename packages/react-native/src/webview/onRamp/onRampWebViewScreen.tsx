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
    console.log('[WebViewBridge] Initializing bridge...');
    
    // Store original postMessage to avoid infinite loops
    const originalPostMessage = window.postMessage;
    
    // Function to send messages to React Native
    function sendToNative(message) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
          console.log('[WebViewBridge] Sending to Native:', messageStr);
          window.ReactNativeWebView.postMessage(messageStr);
        } else {
          console.warn('[WebViewBridge] ReactNativeWebView.postMessage not available');
        }
      } catch (e) {
        console.error('[WebViewBridge] Error sending to native:', e);
      }
    }

    // Create the bridge object that the web app expects
    window.ReactNativeBridge = {
      postMessage: sendToNative
    };

    // Override window.postMessage to handle bidirectional communication
    window.postMessage = function(message, targetOrigin) {
      try {
        
        // If this is a message FROM native (has source: 'okto_web'), handle it locally
        if (typeof message === 'object' && message.source === 'okto_web') {
          console.log('[WebViewBridge] Handling native response:', message);
          
          // Call the global responseChannel if it exists
          if (window.responseChannel && typeof window.responseChannel === 'function') {
            window.responseChannel(message);
          }
          
          // Also dispatch as MessageEvent for addEventListener handlers
          const event = new MessageEvent('message', {
            data: message,
            origin: window.location.origin,
            source: window
          });
          window.dispatchEvent(event);
          
          return;
        }
        
        // For messages TO native, send through our bridge
        if (typeof message === 'string') {
          try {
            const parsed = JSON.parse(message);
            // Only send to native if it's not already a response from native
            if (!parsed.source || parsed.source !== 'okto_web') {
              sendToNative(message);
            }
          } catch (e) {
            // If it's not JSON, send as is
            sendToNative(message);
          }
        } else {
          // Object message
          if (!message.source || message.source !== 'okto_web') {
            sendToNative(message);
          }
        }
      } catch (e) {
        console.error('[WebViewBridge] Error in postMessage override:', e);
        // Fallback to original postMessage
        originalPostMessage.call(window, message, targetOrigin);
      }
    };

    // Handle messages from parent (native)
    window.addEventListener('message', function(event) {
      console.log('[WebViewBridge] Received message event:', event.data)

      if (event.data && event.data.source === 'okto_web') {
        console.log('[WebViewBridge] Processing native message:', event.data);
        
        if (window.responseChannel && typeof window.responseChannel === 'function') {
          window.responseChannel(event.data);
        }
      }
    });

    sendToNative({
      type: 'bridge_ready',
      message: 'WebView bridge initialized successfully'
    });

  })();
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
    try {
      // Verify the message can be parsed
      const parsed = JSON.parse(event.nativeEvent.data);
      console.log('Parsed message:', parsed);
      bridgeRef.current?.handleMessage(event);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
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
          injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
          onError={handleWebViewError}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="compatibility"
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
