// WebViewScreen.tsx
import { useState, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, BackHandler, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WebViewBridge } from '../webViewBridge.js';
import type { WebViewParamList } from '../types.js';
import { OktoClient } from '@okto_web3/core-js-sdk';
import { AuthWebViewRequestHandler } from './authWebViewHandlers.js';

type Props = NativeStackScreenProps<WebViewParamList, 'WebViewScreen'>;

/**
 * WebViewScreen - Renders a WebView with communication bridge for authentication flows
 *
 * This component integrates with OktoClient to handle authentication processes
 * through a WebView, establishing a two-way communication channel between
 * the React Native app and web content.
 */
export const WebViewScreen = ({ route, navigation }: Props) => {
  const { url, title, clientConfig } = route.params;

  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the communication bridge with the WebView
  const bridge = useRef(new WebViewBridge(webViewRef)).current;

  console.log('Initializing OktoClient with config:', clientConfig);
  const oktoClient = useRef(
    new OktoClient({
      environment: clientConfig.environment as 'staging' | 'sandbox',
      clientPrivateKey: clientConfig.clientPrivateKey,
      clientSWA: clientConfig.clientSWA,
    }),
  ).current;

  const navigateBack = () => {
    navigation.goBack();
  };

  // Initialize the authentication request handler with necessary dependencies
  const requestHandler = useRef(
    new AuthWebViewRequestHandler(bridge, navigateBack, oktoClient),
  ).current;

  useEffect(() => {
    if (title) {
      navigation.setOptions({ title });
    }
  }, [title, navigation]);

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
        return true;
      },
    );

    return () => backHandler.remove();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onMessage={bridge.handleWebViewMessage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          setIsLoading(false);
          // Re-initialize bridge connections after page load completes
          bridge.reinitializeBridge();
        }}
        injectedJavaScript={bridge.getInjectedJavaScript()}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
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
