import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { OnRampWebViewBridge } from './webViewBridge.js';
import type { OnrampCallbacks, OnRampScreenProps } from './types.js';


export const OnRampScreen: React.FC<OnRampScreenProps> = ({
  url,
  tokenId,
  oktoClient,
  onClose,
  onSuccess,
  onError,
  onProgress,
}) => {
  const webViewRef = useRef<WebView>(null);
  const bridgeRef = useRef<OnRampWebViewBridge | null>(null);
  //   const [isWebViewReady, setIsWebViewReady] = useState(false);

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

  // Initialize the WebView bridge
  useEffect(() => {
    const callbacks: OnrampCallbacks = {
      onSuccess: handleSuccess,
      onError: handleError,
      onClose: handleClose,
      onProgress: handleProgress,
    };

    // Create the bridge instance
    bridgeRef.current = new OnRampWebViewBridge(webViewRef, callbacks);

    // Set up additional request handlers if needed
    bridgeRef.current.registerRequestHandler('getTokenData', async () => {
      return {
        tokenId,
        status: 'success',
      };
    });

    // bridgeRef.current.registerRequestHandler('getClientInfo', async () => {
    //   return {
    //     clientId: oktoClient.getClientId?.() || 'unknown',
    //     status: 'success'
    //   };
    // });

    // Cleanup on unmount
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

  // Handle WebView message events
  const handleWebViewMessage = useCallback((event: any) => {
    if (bridgeRef.current) {
      bridgeRef.current.handleMessage(event);
    }
  }, []);

  // Handle WebView load completion
  const handleWebViewLoadEnd = useCallback(() => {
    console.log('OnRamp WebView loaded');
    // setIsWebViewReady(true);

    // Mark the bridge as ready and flush any queued messages
    if (bridgeRef.current) {
      bridgeRef.current.setWebViewReady();

      // Send initial data to the WebView
      setTimeout(() => {
        bridgeRef.current?.sendInfo('tokenData', {
          tokenId,
          timestamp: Date.now(),
        });
      }, 500);
    }
  }, [tokenId]);

  // Handle WebView errors
  const handleWebViewError = useCallback(() => {
    const errorMessage =
      'Failed to load payment page. Please check your internet connection.';
    console.error('OnRamp WebView Error:', errorMessage);
    handleError(errorMessage);
  }, [handleError]);

  // Injected JavaScript for WebView
  const injectedJavaScript = `
    (function() {
      // Set up the bridge on the web side
      window.ReactNativeWebView = window.ReactNativeWebView || {};
      
      // Helper function to send messages to React Native
      window.sendToReactNative = function(message) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        }
      };
      
      // Listen for messages from the OnRamp web application
      window.addEventListener('message', function(event) {
        if (event.data && typeof event.data === 'object') {
          window.sendToReactNative(event.data);
        }
      });
      
      // Notify React Native that the WebView is ready
      window.sendToReactNative({
        type: 'info',
        id: 'webview_ready_' + Date.now(),
        event: 'webViewReady',
        params: { ready: true },
        source: 'onramp_web',
        timestamp: Date.now()
      });
      
      console.log('OnRamp WebView bridge initialized');
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
          // Additional props for better OnRamp integration
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    minWidth: 44,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: '#666666',
    fontWeight: '300',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});
