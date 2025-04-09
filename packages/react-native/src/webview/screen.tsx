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

// Fix the props typing - NativeStackScreenProps is already the combined route & navigation props
type Props = NativeStackScreenProps<WebViewParamList, 'WebViewScreen'>;

// import { SafeAreaView } from 'react-native';
// import { WebView } from 'react-native-webview';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
// import type { RootStackParamList } from './core/navigation.js'; // adjust path

// type Props = NativeStackScreenProps<RootStackParamList, 'OktoWebView'>;

// export const WebViewScreen = ({ route }: Props) => {
//   const { url } = route.params;

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <WebView
//         source={{ uri: url }}
//         // startInLoadingState={true}
//         javaScriptEnabled={true}
//       />
//     </SafeAreaView>
//   );
// };


export const WebViewScreen = ({ route }: Props) =>{
  const { url, title } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Set navigation title if provided
  // useEffect(() => {
  //   if (title) {
  //     navigation.setOptions({ title });
  //   }
  // }, [title, navigation]);
  
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
    
    // Send loading state
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
    const { provider } = request.data;
    
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send success response
    sendResponseToWebView(webViewRef, {
      id: request.id,
      method: request.method,
      data: {
        status: 'success',
        message: `Successfully logged in with ${provider}`,
        token: `sample-token-${uuidv4().substring(0, 8)}`
      }
    });
  };

  // Handle info messages
  const handleInfo = (info: WebViewRequest) => {
    console.log('Received info from WebView:', info);
    // Process info messages (logging, analytics, etc.)
  };

  // Inject communication functions into WebView
  const injectedJavaScript = `
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
    
    // Define response handler
    window.responseChannel = function(response) {
      // Find and execute the callback for this response
      if (window.pendingRequests && window.pendingRequests[response.id]) {
        window.pendingRequests[response.id](response);
        if (response.status !== 'loading') {
          delete window.pendingRequests[response.id];
        }
      }
    };
    
    // Store pending requests
    window.pendingRequests = window.pendingRequests || {};
    
    // Let the SDK know the bridge is ready
    setTimeout(function() {
      if (window.onBridgeReady) {
        window.onBridgeReady();
      }
    }, 100);
    
    true;
  `;

  return (

    
      // <WebView
      //   ref={webViewRef}
      //   source={{ uri: url }}
      //   onMessage={onMessage}
      //   onLoadStart={() => setIsLoading(true)}
      //   onLoadEnd={() => setIsLoading(false)}
      //   injectedJavaScript={injectedJavaScript}
      //   javaScriptEnabled={true}
      //   domStorageEnabled={true}
      //   originWhitelist={['*']}
      //   style={styles.webview}
      // />

      <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{ uri: url }}
        // startInLoadingState={true}
        javaScriptEnabled={true}
      />
    </SafeAreaView>
      // {isLoading && (
      //   <View style={styles.loadingContainer}>
      //     <ActivityIndicator size="large" color="#0000ff" />
      //   </View>
      // )}
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  webview: {
    flex: 1
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)'
  }
});