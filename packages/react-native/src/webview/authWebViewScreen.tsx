// WebViewScreen.tsx
import { useState, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, BackHandler, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WebViewBridge } from './webViewBridge.js';
import type { WebViewParamList } from './types.js';
import { OktoClient } from '@okto_web3/core-js-sdk';
import { WebViewRequestHandler } from './webViewHandlers.js';

type Props = NativeStackScreenProps<WebViewParamList, 'WebViewScreen'>;

export const WebViewScreen = ({ route, navigation }: Props) => {
  const { url, title, clientConfig } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const bridge = useRef(new WebViewBridge(webViewRef)).current;
  
  // Initialize OktoClient with provided configuration
  const oktoClient = useRef(new OktoClient({
    environment: 'staging',
    clientPrivateKey: "0x6429139c72d61f3fa8f9197e812031b575ec09852670cfaaafa9db52205f9bb5",
    clientSWA: "0x15256FEB5fAea1662Ce9A3fB8A46237B81b6Dfb1",
  })).current;

  // Navigation callback to close the WebView
  const navigateBack = () => {
    navigation.goBack();
  };

  // Initialize request handler with navigation callback and oktoClient
  const requestHandler = useRef(
    new WebViewRequestHandler(bridge, navigateBack, oktoClient),
  ).current;

  // Set navigation title if provided
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
  }, []);

  // Handle back button
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