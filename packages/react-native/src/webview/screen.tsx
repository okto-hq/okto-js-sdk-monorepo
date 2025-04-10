// WebViewScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { View, ActivityIndicator, StyleSheet, BackHandler, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';

// Import from .ts files instead of .js
import { 
  handleWebViewMessage, 
  sendResponseToWebView, 
  type WebViewRequest, 
  type WebViewResponse 
} from './communication.js';

// Define the navigation param list
export type WebViewParamList = {
  WebViewScreen: {
    url: string;
    title?: string;
  };
};

type Props = NativeStackScreenProps<WebViewParamList, 'WebViewScreen'>;

export const WebViewScreen = ({ route, navigation }: Props) => {
  const { url, title } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Set navigation title if provided
  useEffect(() => {
    if (title) {
      navigation.setOptions({ title });
    }
  }, [title, navigation]);
  
  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    
    return () => backHandler.remove();
  }, []);

  // Handle messages from WebView
  const onMessage = (event: WebViewMessageEvent) => {
    handleWebViewMessage(event, {
      onRequest: handleRequest,
      onInfo: handleInfo
    });
  };

  // Handle request messages
  const handleRequest = async (request: WebViewRequest) => {
    console.log('Received request from WebView:', request);
    
    // Send loading state immediately
    sendResponseToWebView(webViewRef, {
      id: request.id,
      method: request.method,
      data: {
        status: 'loading',
        message: 'Processing request...'
      }
    });
    
    try {
      // Process the request based on method
      switch (request.method) {
        case 'okto_sdk_login':
          await handleLoginRequest(request);
          break;
        // Add other method handlers as needed
        default:
          throw new Error(`Unknown method: ${request.method}`);
      }
    } catch (error) {
      console.error('Error handling request:', error);
      // Send error response
      sendResponseToWebView(webViewRef, {
        id: request.id,
        method: request.method,
        data: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  // Handle login request
  const handleLoginRequest = async (request: WebViewRequest) => {
    console.log('Handling login request:', request.data);
    const { provider } = request.data;
    
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send success response
    const response: WebViewResponse = {
      id: request.id,
      method: request.method,
      data: {
        status: 'success',
        message: `Successfully logged in with ${provider}`,
        token: `sample-token-${uuidv4().substring(0, 8)}`
      }
    };
    
    console.log('Sending response:', response);
    sendResponseToWebView(webViewRef, response);
  };

  // Handle info messages
  const handleInfo = (info: WebViewRequest) => {
    console.log('Received info from WebView:', info);
    // Process info messages (logging, analytics, etc.)
  };

  // Inject communication functions into WebView
  const injectedJavaScript = `
    (function() {
      // Define communication channels
      window.requestChannel = {
        postMessage: function(message) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            eventName: 'requestChannel',
            eventData: message
          }));
        }
      };
      
      window.infoChannel = {
        postMessage: function(message) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            eventName: 'infoChannel',
            eventData: message
          }));
        }
      };
      
      // Store pending requests
      window.pendingRequests = window.pendingRequests || {};
      
      // Define response handler
      window.responseChannel = function(response) {
        console.log('Response received in WebView:', response);
        
        // Find and execute the callback for this response
        if (window.pendingRequests && window.pendingRequests[response.id]) {
          window.pendingRequests[response.id](response);
          if (response.status !== 'loading') {
            delete window.pendingRequests[response.id];
          }
        } else {
          console.warn('No pending request found for response ID:', response.id);
        }
      };
      
      // Let the SDK know the bridge is ready
      window.addEventListener('load', function() {
        setTimeout(function() {
          console.log('Bridge is ready');
          if (window.onBridgeReady) {
            window.onBridgeReady();
          }
        }, 300);
      });
      
      console.log('Communication bridge initialized');
      true;
    })();
  `;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onMessage={onMessage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          setIsLoading(false);
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              (function() {
                console.log('Re-initializing bridge after page load');
                // Check if bridge needs to be initialized
                if (!window.requestChannel || !window.infoChannel || !window.responseChannel) {
                  ${injectedJavaScript}
                }
                true;
              })();
            `);
          }
        }}
        injectedJavaScript={injectedJavaScript}
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  }
});