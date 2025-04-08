import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { WebView, type WebViewProps } from 'react-native-webview';
import type { HostReqIntf, HostResIntf } from '../types/webView.js';
import { OktoWebViewManager } from './webViewManager.js';

interface OktoWebViewModalProps {
  isVisible: boolean;
  onClose: () => void;
  url: string;
  webViewProps?: Partial<WebViewProps>;
}

const OktoWebViewModal: React.FC<OktoWebViewModalProps> = ({
  isVisible,
  onClose,
  url,
  webViewProps = {}
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const manager = OktoWebViewManager.getInstance();
  
  useEffect(() => {
    if (webViewRef.current) {
      manager.setWebViewRef({
        sendRequest: (method: string, data: any) => {
          return sendRequest(method, data);
        },
        sendInfo: (method: string, data: any) => {
          sendInfo(method, data);
        },
        sendResponse: (requestId: string, method: string, responseData: any) => {
          sendResponse(requestId, method, responseData);
        }
      });
    }
    
    return () => {
      if (!isVisible) {
        manager.setWebViewRef(null);
      }
    };
  }, [webViewRef.current, isVisible]);
  
  // Inject communication channels into WebView
  const injectedJavaScript = `
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
    
    window.responseChannel = function(data) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        channel: 'responseChannel',
        data: data
      }));
    };
    
    true;
  `;
  
  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      const { data } = event.nativeEvent;
      const parsedData = JSON.parse(data);
      const { channel, data: messageData } = parsedData;
      
      let parsedMessageData;
      try {
        // If messageData is a string, try to parse it
        parsedMessageData = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
      } catch (e) {
        parsedMessageData = messageData;
      }
      
      switch (channel) {
        case 'requestChannel':
          manager.handleRequestFromWebView(parsedMessageData);
          break;
        case 'infoChannel':
          manager.handleInfoFromWebView(parsedMessageData);
          break;
        case 'responseChannel':
          break;
        default:
          console.warn('Unknown channel:', channel);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };
  
  // Send request to WebView and handle response
  const sendRequest = (method: string, data: any): Promise<HostResIntf> => {
    if (!isWebViewReady || !webViewRef.current) {
      return Promise.reject('WebView is not ready');
    }
    
    const requestId = uuidv4(); // Generate a unique ID for the request
    const request: HostReqIntf = {
      id: requestId,
      method,
      data,
    };
    
    return new Promise((resolve) => {
      // Create a message handler for this specific request
      const messageHandler = (event: any) => {
        try {
          const { data: messageData } = event.nativeEvent;
          const parsedData = JSON.parse(messageData);
          
          if (
            parsedData.channel === 'responseChannel' &&
            parsedData.data &&
            parsedData.data.id === requestId
          ) {
            // Remove the listener once we get our response
            if (webViewRef.current) {
              resolve(parsedData.data);
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      };
      
      // Add a one-time message handler for this request
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          (function() {
            const request = ${JSON.stringify(request)};
            window.requestChannel.postMessage(JSON.stringify(request));
            return true;
          })();
        `);
      }
    });
  };
  
  // Send info to WebView (no response expected)
  const sendInfo = (method: string, data: any): void => {
    if (!isWebViewReady || !webViewRef.current) {
      console.warn('WebView is not ready');
      return;
    }
    
    const infoId = uuidv4();
    const info: HostReqIntf = {
      id: infoId,
      method,
      data,
    };
    
    webViewRef.current.injectJavaScript(`
      (function() {
        const info = ${JSON.stringify(info)};
        window.infoChannel.postMessage(JSON.stringify(info));
        return true;
      })();
    `);
  };
  
  // Send response to WebView
  const sendResponse = (requestId: string, method: string, responseData: any): void => {
    if (!isWebViewReady || !webViewRef.current) {
      console.warn('WebView is not ready');
      return;
    }
    
    const response: HostResIntf = {
      id: requestId,
      method,
      data: responseData,
    };
    
    webViewRef.current.injectJavaScript(`
      (function() {
        const response = ${JSON.stringify(response)};
        window.responseChannel(response);
        return true;
      })();
    `);
  };
  const TypedWebView = WebView as unknown as React.ComponentType<any>;
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <TypedWebView
          ref={webViewRef}
          source={{ uri: url }}
          injectedJavaScript={injectedJavaScript}
          onMessage={handleMessage}
          onLoad={() => setIsWebViewReady(true)}
          originWhitelist={['*']} // Consider restricting this in production
          javaScriptEnabled={true}
          domStorageEnabled={true}
          {...webViewProps}
          style={styles.webview}
        />
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  webview: {
    flex: 1,
  },
});

export default OktoWebViewModal;

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (+c ^ (crypto?.getRandomValues?.(new Uint8Array(1))?.[0] ?? Math.random() * 16) & 15 >> +c / 4).toString(16)
    );
  }
