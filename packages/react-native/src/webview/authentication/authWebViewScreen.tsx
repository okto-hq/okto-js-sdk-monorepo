// WebViewScreen.tsx
import { useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, BackHandler, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WebViewBridge } from './webViewBridge.js';
import type { WebViewParamList } from './types.js';
import { OktoClient } from '@okto_web3/core-js-sdk';
import { AuthWebViewRequestHandler } from './authWebViewHandlers.js';

/**
 * Props type for WebViewScreen component using React Navigation's typing system
 */
type Props = NativeStackScreenProps<WebViewParamList, 'WebViewScreen'> & {
  onWebViewClose?: () => void;
};

/**
 * WebViewScreen - Renders a WebView with communication bridge for authentication flows
 *
 * This component integrates with OktoClient to handle authentication processes
 * through a WebView, establishing a two-way communication channel between
 * the React Native app and web content.
 */
export const WebViewScreen = ({ route, navigation }: Props) => {
  // Extract parameters passed through navigation
  const { url, title, clientConfig, redirectUrl, uiConfig, onWebViewClose } =
    route.params;

  // Create refs
  const webViewRef = useRef<WebView>(null);

  // Initialize the communication bridge with the WebView
  const bridge = useRef(new WebViewBridge(webViewRef)).current;

  const oktoClientRef = useRef<OktoClient | null>(null);

  if (!oktoClientRef.current) {
    oktoClientRef.current = new OktoClient({
      environment: clientConfig.environment as 'staging' | 'sandbox',
      clientPrivateKey: clientConfig.clientPrivateKey,
      clientSWA: clientConfig.clientSWA,
    });
  }

  const oktoClient = oktoClientRef.current;

  /**
   * Navigation callback to return to previous screen
   * Used by request handlers to close WebView when appropriate
   */
  const navigateBack = () => {
    if (onWebViewClose) {
      onWebViewClose();
    }

    navigation.goBack();
  };

  useEffect(() => {
    if (!redirectUrl) {
      console.error('Missing required redirectUrl parameter');
      navigateBack();
    }
  }, [redirectUrl]);

  // Initialize the authentication request handler with necessary dependencies
  const requestHandler = useRef(
    new AuthWebViewRequestHandler(
      bridge,
      navigateBack,
      oktoClient,
      redirectUrl,
      uiConfig,
    ),
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
    if (uiConfig) {
      console.log('UI config provided:', uiConfig);
    }
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
        onMessage={bridge.handleWebViewMessage}
        onLoadEnd={() => {
          // Re-initialize bridge connections after page load completes
          bridge.reinitializeBridge();
        }}
        injectedJavaScriptBeforeContentLoaded={bridge.getInjectedJavaScript()}
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
