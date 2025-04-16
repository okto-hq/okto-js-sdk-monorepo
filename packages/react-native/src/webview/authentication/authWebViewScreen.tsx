// WebViewScreen.tsx
import { useState, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, BackHandler, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WebViewBridge } from '../webViewBridge.js';
import type { WebViewParamList } from '../types.js';
import { OktoClient } from '@okto_web3/core-js-sdk';
import { AuthWebViewRequestHandler } from './authWebViewHandlers.js';
import { getStorage } from '../../utils/storageUtils.js';

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
  
  // Create a function to initialize or reinitialize the OktoClient
  const createOktoClient = () => {
    console.log('Initializing OktoClient with config:', clientConfig);
    const client = new OktoClient({
      environment: clientConfig.environment as 'staging' | 'sandbox',
      clientPrivateKey: clientConfig.clientPrivateKey,
      clientSWA: clientConfig.clientSWA,
    });
    
    // Try to load any existing session
    const storedSession = getStorage('okto_session_whatsapp');
    if (storedSession) {
      try {
        const sessionConfig = JSON.parse(storedSession);
        client.setSessionConfig(sessionConfig);
        console.log('Loaded session from storage:', sessionConfig);
      } catch (error) {
        console.error('Failed to parse stored session:', error);
      }
    }
    
    return client;
  };
  
  // Create initial OktoClient instance
  const oktoClientRef = useRef(createOktoClient());
  
  // Create a navigation callback that reinitializes the OktoClient
  const navigateBack = () => {
    oktoClientRef.current = createOktoClient();
    console.log('Reinitialized OktoClient before navigation');
    navigation.goBack();
  };

  // Initialize the authentication request handler with necessary dependencies
  // Use a state or ref to update the request handler when oktoClient changes
  const requestHandlerRef = useRef(
    new AuthWebViewRequestHandler(bridge, navigateBack, oktoClientRef.current)
  );

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
    console.log('Request handler:', requestHandlerRef.current);
  }, []);

  // Handle hardware back button presses
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Reinitialize OktoClient before navigating back
        oktoClientRef.current = createOktoClient();
        console.log('Reinitialized OktoClient on back button press');
        
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