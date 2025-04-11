// WebViewScreen.tsx
import { useState, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, BackHandler, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WebViewBridge } from './webViewBridge.js';
import { WebViewRequestHandler } from './webViewHandlers.js';
import type { WebViewParamList } from './types.js';

type Props = NativeStackScreenProps<WebViewParamList, 'WebViewScreen'>;

export const WebViewScreen = ({ route, navigation }: Props) => {
  const { url, title } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const bridge = useRef(new WebViewBridge(webViewRef)).current;

  // Navigation callback to close the WebView
  const navigateBack = () => {
    navigation.goBack();
  };

  // Initialize request handler with navigation callback
  const requestHandler = useRef(
    new WebViewRequestHandler(bridge, navigateBack),
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
  },
});
