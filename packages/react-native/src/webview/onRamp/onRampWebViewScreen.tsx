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
    console.log('[WebView] Initializing channel-based bridge...');
    
    // Initialize React Native WebView bridge
    window.ReactNativeWebView = window.ReactNativeWebView || {};
    
    // Channel system for communication
    window.channels = {
      launch: null,
      request: null,
      info: null,
      response: null
    };
    
    // Global message sender for React Native
    window.sendToReactNative = function(message) {
      console.log('[WebView -> React Native] Sending message:', message);
      if (window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    };
    
    // Setup channel handlers that will be populated by the bridge
    window.launchChannel = {
      postMessage: function(data) {
        console.log('[WebView] launchChannel.postMessage called:', data);
        window.sendToReactNative({
          channel: 'launchChannel',
          data: data
        });
      }
    };

    window.requestChannel = {
      postMessage: function(data) {
        console.log('[WebView] requestChannel.postMessage called:', data);
        window.sendToReactNative({
          channel: 'requestChannel',
          data: data
        });
      }
    };

    window.infoChannel = {
      postMessage: function(data) {
        console.log('[WebView] infoChannel.postMessage called:', data);
        window.sendToReactNative({
          channel: 'infoChannel',
          data: data
        });
      }
    };

    // Response channel for receiving data from React Native
    window.responseChannel = function(hostRes) {
      console.log('[WebView] responseChannel called with:', hostRes);
      
      // Trigger any registered callbacks
      if (window.hostResponseCallbacks) {
        window.hostResponseCallbacks.forEach(callback => {
          try {
            callback(hostRes);
          } catch (error) {
            console.error('[WebView] Error in response callback:', error);
          }
        });
      }
      
      // Dispatch custom event for response handling
      const event = new CustomEvent('hostResponse', { detail: hostRes });
      window.dispatchEvent(event);
    };

    // Initialize callback registry
    window.hostResponseCallbacks = window.hostResponseCallbacks || [];
    
    // Add method to register response callbacks
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

    // Listen for messages from React Native (if using postMessage pattern)
    window.addEventListener('message', function(event) {
      console.log('[React Native -> WebView] Received message:', event.data);
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // If this is a response, trigger the response channel
        if (data.type && data.source) {
          window.responseChannel(data);
        }
      } catch (error) {
        console.error('[WebView] Error processing message:', error);
      }
    });

    console.log('[WebView] Channel-based bridge initialization complete');
  })();
  true;
`;

export const OnRampScreen = ({ route, navigation }: Props) => {
  console.log('[OnRampScreen] Initializing with route params:', route.params);
  
  const { url, tokenId, oktoClient, onClose, onSuccess, onError, onProgress } = route.params;
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
    onClose?.();
    navigation.goBack();
  }, [onClose, navigation]);

  const handleProgress = useCallback(
    (progress: number) => {
      console.log('[OnRampScreen] Progress update:', progress);
      onProgress?.(progress);
    },
    [onProgress],
  );

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        console.log('[OnRampScreen] Hardware back button pressed');
        handleClose();
        return true;
      },
    );
    return () => backHandler.remove();
  }, [handleClose]);

  // Initialize bridge when component mounts
  useEffect(() => {
    console.log('[OnRampScreen] Setting up bridge...');
    
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
      console.log('[OnRampScreen] Cleaning up bridge...');
      bridgeRef.current?.cleanup();
      bridgeRef.current = null;
    };
  }, [tokenId, oktoClient, handleSuccess, handleError, handleClose, handleProgress]);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    console.log('[OnRampScreen] Received message from WebView:', event.nativeEvent.data);
    
    try {
      bridgeRef.current?.handleMessage(event);
    } catch (error) {
      console.error('[OnRampScreen] Error handling WebView message:', error);
      handleError('Communication error with payment interface');
    }
  }, [handleError]);

  const handleWebViewError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[OnRampScreen] WebView error:', nativeEvent);
    
    handleError(
      'Failed to load payment page. Please check your internet connection and try again.'
    );
  }, [handleError]);

  const handleWebViewHttpError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[OnRampScreen] WebView HTTP error:', nativeEvent);
    
    handleError(
      `Payment page failed to load (${nativeEvent.statusCode}). Please try again.`
    );
  }, [handleError]);

  const handleWebViewLoadEnd = useCallback(() => {
    console.log('[OnRampScreen] WebView finished loading');
    
    // Inject additional JavaScript if needed after page load
    const postLoadJS = `
      (function() {
        console.log('[WebView] Post-load initialization...');
        
        // Verify all channels are properly set up
        const channels = ['launchChannel', 'requestChannel', 'infoChannel', 'responseChannel'];
        channels.forEach(channel => {
          if (window[channel]) {
            console.log('[WebView] Channel ' + channel + ' is available');
          } else {
            console.warn('[WebView] Channel ' + channel + ' is missing');
          }
        });
        
        // Notify that WebView is ready
        window.sendToReactNative({
          type: 'webview_ready',
          timestamp: Date.now()
        });
      })();
      true;
    `;
    
    webViewRef.current?.injectJavaScript(postLoadJS);
  }, []);

  const handleWebViewLoadStart = useCallback(() => {
    console.log('[OnRampScreen] WebView started loading');
  }, []);

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
          onLoadEnd={handleWebViewLoadEnd}
          onLoadStart={handleWebViewLoadStart}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          style={styles.webView}
          allowsBackForwardNavigationGestures={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          startInLoadingState={true}
          allowsLinkPreview={false}
          // Additional security and performance settings
          originWhitelist={['*']}
          allowsFullscreenVideo={true}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          scalesPageToFit={true}
          // iOS specific props
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          // Android specific props
          overScrollMode="never"
          nestedScrollEnabled={true}
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