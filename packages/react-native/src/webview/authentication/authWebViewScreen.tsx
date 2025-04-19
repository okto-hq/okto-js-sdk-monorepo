// WebViewScreen.tsx (with minimal modifications)
import { useState, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, BackHandler, SafeAreaView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WebViewBridge } from '../webViewBridge.js';
import type { WebViewParamList } from '../types.js';
import { OktoClient } from '@okto_web3/core-js-sdk';
import { AuthWebViewRequestHandler } from './authWebViewHandlers.js';

/**
 * Props type for WebViewScreen component using React Navigation's typing system
 */
type Props = NativeStackScreenProps<WebViewParamList, 'WebViewScreen'>;

/**
 * WebViewScreen - Renders a WebView with communication bridge for authentication flows
 *
 * This component integrates with OktoClient to handle authentication processes
 * through a WebView, establishing a two-way communication channel between
 * the React Native app and web content.
 */
export const WebViewScreen = ({ route, navigation }: Props) => {
  // Extract parameters passed through navigation
  const { url, title, clientConfig, handleNavigation } = route.params;

  // Create refs and state
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the communication bridge with the WebView
  const bridge = useRef(new WebViewBridge(webViewRef)).current;

  // Initialize OktoClient with the configuration provided through navigation
  console.log('Initializing OktoClient with config:', clientConfig);
  const oktoClient = useRef(
    new OktoClient({
      environment: clientConfig.environment as 'staging' | 'sandbox',
      clientPrivateKey: clientConfig.clientPrivateKey,
      clientSWA: clientConfig.clientSWA,
    }),
  ).current;

  /**
   * Navigation callback to return to previous screen
   * Used by request handlers to close WebView when appropriate
   */
  const navigateBack = () => {
    navigation.goBack();
  };

  // Initialize the authentication request handler with necessary dependencies
  const requestHandler = useRef(
    new AuthWebViewRequestHandler(bridge, navigateBack, oktoClient),
  ).current;

  // Update navigation title if provided in route params
  useEffect(() => {
    if (title) {
      navigation.setOptions({ title });
    }
  }, [title, navigation]);

  // Debug logging for component initialization
  useEffect(() => {
    console.log('WebView ref:', {
      refObject: webViewRef,
      currentValue: webViewRef.current,
    });
    console.log('Request handler:', requestHandler);
  }, []);

  // Handle hardware back button presses
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true; // Prevent default behavior
      },
    );

    // Clean up the event listener on component unmount
    return () => backHandler.remove();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        userAgent={Platform.OS === 'android' ? 'Chrome/18.0.1025.133 Mobile Safari/535.19' : 'AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75'}
        onMessage={bridge.handleWebViewMessage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          setIsLoading(false);
          // Re-initialize bridge connections after page load completes
          bridge.reinitializeBridge();
        }}
        // Add navigation state change handler for Google auth flow
        onNavigationStateChange={(navState) => {
          // If we have a custom navigation handler, call it
          if (handleNavigation) {
            handleNavigation(navState);
            
            // If this is a redirect URL, navigate back
            if (navState.url && navState.url.startsWith('oktosdk://')) {
              navigation.goBack();
            }
          }
        }}
        injectedJavaScript={bridge.getInjectedJavaScript()}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']} // Consider restricting this in production
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
});