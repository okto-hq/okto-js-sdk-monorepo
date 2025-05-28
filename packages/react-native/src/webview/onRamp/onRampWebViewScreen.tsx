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
    function sendMessage(msg) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          const stringifiedMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
          console.log('[WebViewBridge] Sending message to React Native:', stringifiedMsg);
          window.ReactNativeWebView.postMessage(stringifiedMsg);
        } else {
          console.warn('ReactNativeWebView.postMessage not found');
        }
      } catch (e) {
        console.error('Error sending message to React Native:', e);
      }
    }

    window.ReactNativeBridge = {
      postMessage: sendMessage
    };

    // Test bridge
    sendMessage({
      type: 'test',
      message: 'Bridge initialized'
    });

    // Store original postMessage
    const originalPostMessage = window.postMessage;
    
    // Override postMessage to intercept WebView -> Native communication
    window.postMessage = function(msg) {
      try {
        const parsedMsg = typeof msg === 'string' ? JSON.parse(msg) : msg;
        
        // Only forward messages that are NOT responses from the native bridge
        // Responses have 'source' === 'okto_web' or contain 'response' field
        if (parsedMsg.source !== 'okto_web' && parsedMsg.response === undefined) {
          console.log('[WebViewBridge] Forwarding request to React Native:', parsedMsg);
          sendMessage(msg);
        } else {
          console.log('[WebViewBridge] Handling response from React Native:', parsedMsg);
          // Handle the response in the WebView (this is where your web app would process the data)
          if (window.handleNativeResponse) {
            window.handleNativeResponse(parsedMsg);
          }
        }
      } catch (e) {
        console.error('[WebViewBridge] Error processing message:', e);
        // Fallback: send the message anyway
        sendMessage(msg);
      }
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

  const initialTokenData = {
    type: "data",
    response: {
      tokenData: JSON.stringify({
        id: "b5a9350d-2d00-3381-b913-ee9f989d48f7",
        name: "(PoS) Tether USD",
        symbol: "USDT",
        iconUrl: "https://images.okto.tech/token_logos/USDT.png",
        networkId: "ae506585-0ba7-32f3-8b92-120ddf940198",
        networkName: "POLYGON",
        address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        precision: "4",
        chainId: "137"
      })
    },
    source: "okto_web",
    id: "b5a9350d-2d00-3381-b913-ee9f989d48f7"
  };

  const sendInitialTokenData = useCallback(() => {
    const jsCode = `
      (function() {
        try {
          const message = ${JSON.stringify(initialTokenData)};
          if (window.handleNativeResponse) {
            window.handleNativeResponse(message);
            console.log('[KARAN] Forwarding request to web', message);
          } else {
            // Fallback if handler not registered yet
            setTimeout(() => {
              if (window.handleNativeResponse) {
                console.log('Sending initial token data after delay);
                console.log('[KARAN] Forwarding request to web: check', message);
                window.handleNativeResponse(message);
              } else {
                console.warn('handleNativeResponse not available');
              }
            }, 500);
          }
          true;
        } catch(e) {
          console.error('Error sending initial token data:', e);
          true;
        }
      })();
    `;
  
    webViewRef.current?.injectJavaScript(jsCode);
  }, []);

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
      const parsed = JSON.parse(event.nativeEvent.data);
      console.log('Parsed message:', parsed);
      
      // Check if this is a tokenData request
      if (parsed.type === 'data' && parsed.params?.key === 'tokenData') {
        console.log('[OnRampScreen] Detected tokenData request, sending initial data');
        sendInitialTokenData();
        return; 
      }
      bridgeRef.current?.handleMessage(event);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }, [sendInitialTokenData]);

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
          onLoadEnd={sendInitialTokenData}
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
