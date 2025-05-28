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
    
    // Store original postMessage
    const originalPostMessage = window.postMessage;
    
    // Safe message sender with validation
    function sendToNative(message) {
      try {
        if (!window.ReactNativeWebView?.postMessage) {
          console.warn('[WebViewBridge] ReactNativeWebView not available');
          return;
        }
        
        let messageStr;
        try {
          messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        } catch (e) {
          console.error('[WebViewBridge] Failed to stringify message:', e);
          return;
        }
        
        console.log('[WebViewBridge] Sending to Native:', messageStr);
        window.ReactNativeWebView.postMessage(messageStr);
      } catch (e) {
        console.error('[WebViewBridge] Error in sendToNative:', e);
      }
    }

    // Create the bridge object
    window.ReactNativeBridge = { postMessage: sendToNative };
    
    // Response channel with validation
    window.responseChannel = function(hostRes) {
      try {
        if (!hostRes) {
          console.warn('[WebViewBridge] Empty response received');
          return;
        }
        console.log('[WebViewBridge] Response channel called:', hostRes);
        
        // Handle the response here if needed
      } catch (e) {
        console.error('[WebViewBridge] Error in responseChannel:', e);
      }
    };

    // Enhanced postMessage handler
    window.postMessage = function(message, targetOrigin) {
      try {
        // Skip processing if message is invalid
        if (message === undefined || message === null) {
          return originalPostMessage.call(window, message, targetOrigin);
        }
        
        // Handle native responses
        if (typeof message === 'object' && message.source === 'okto_web') {
          console.log('[WebViewBridge] Handling native response:', message);
          
          if (typeof window.responseChannel === 'function') {
            window.responseChannel(message);
          }
          
          const event = new MessageEvent('message', {
            data: message,
            origin: targetOrigin || window.location.origin,
          });
          window.dispatchEvent(event);
          return;
        }
        
        // Send to native if not from native
        if (typeof message === 'string'  && message.trim() !== '' ) {
          try {
            const parsed = JSON.parse(message);
            if (!parsed.source || parsed.source !== 'okto_web') {
              sendToNative(message);
            }
          } catch (e) {
            sendToNative(message);
          }
        } else if (!message.source || message.source !== 'okto_web') {
          sendToNative(message);
        }
      } catch (e) {
        console.error('[WebViewBridge] Error in postMessage override:', e);
        originalPostMessage.call(window, message, targetOrigin);
      }
    };

    // Message event listener with validation
    const messageHandler = function(event) {
      try {
        if (!event?.data) return;
        
        console.log('[WebViewBridge] Received message event:', event.data);
        if (event.data.source === 'okto_web') {
          if (typeof window.responseChannel === 'function') {
            window.responseChannel(event.data);
          }
        }
      } catch (e) {
        console.error('[WebViewBridge] Error in message handler:', e);
      }
    };
    
    window.addEventListener('message', messageHandler);

    // Send ready message
    sendToNative({
      type: 'bridge_ready',
      message: 'WebView bridge initialized successfully'
    });

    // Cleanup function
    return function() {
      window.removeEventListener('message', messageHandler);
    };
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
