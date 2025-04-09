// src/webview/WebViewScreen.tsx

import React, { useRef, useEffect, useState } from 'react';
import { View, SafeAreaView, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { setupResponseChannel, handleWebViewResponse } from './channels.js';
import type { WebViewConfig, HostResponse } from '../types/webview.js';

interface WebViewScreenProps {
  config: WebViewConfig;
  onClose?: () => void;
}

const WebViewScreen: React.FC<WebViewScreenProps> = ({ config, onClose }) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (webViewRef.current) {
      setupResponseChannel(webViewRef);
    }
  }, [webViewRef.current]);

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.channel === 'responseChannel') {
        handleWebViewResponse(message.data as HostResponse);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const injectedJavaScript = `
    // Set up communication channels
    window.requestChannel = {
      postMessage: function(data) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          channel: 'requestChannel',
          data: data
        }));
      }
    };
    
    window.infoChannel = {
      postMessage: function(data) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          channel: 'infoChannel',
          data: data
        }));
      }
    };
    
    // Notify the SDK that the WebView is ready
    window.ReactNativeWebView.postMessage(JSON.stringify({
      channel: 'system',
      data: { event: 'webViewReady' }
    }));
    
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: config.url, headers: config.headers || {} }}
        style={styles.webView}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleMessage}
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
    backgroundColor: '#fff',
  },
  header: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  webView: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
});

export default WebViewScreen;