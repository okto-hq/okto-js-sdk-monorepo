// communication.ts
import type { WebViewMessageEvent } from 'react-native-webview';

export type MessageMethod = 
  'okto_sdk_login' | 
  'okto_ui_state_update' | 
  // Add other methods as needed
  string;

export interface WebViewRequest {
  id: string;
  method: MessageMethod;
  data: Record<string, any>;
}

export interface WebViewResponse {
  id: string;
  method: MessageMethod;
  data: {
    status: 'loading' | 'success' | 'error';
    message?: string;
    [key: string]: any;
  };
}

// Handler for messages from WebView to React Native
export const handleWebViewMessage = (
  event: WebViewMessageEvent,
  callbacks: {
    onRequest?: (request: WebViewRequest) => void;
    onInfo?: (info: WebViewRequest) => void;
  }
) => {
  try {
    const rawData = event.nativeEvent.data;
    console.log('Raw message from WebView:', rawData);
    
    const message = JSON.parse(rawData);
    
    // Determine if it's a request or info message
    if (message.eventName === 'requestChannel') {
      // Handle correctly whether the message is already parsed or needs parsing
      const request = typeof message.eventData === 'string' 
        ? JSON.parse(message.eventData) 
        : message.eventData;
        
      console.log('Parsed request:', request);
      callbacks.onRequest?.(request);
    } else if (message.eventName === 'infoChannel') {
      // Handle correctly whether the message is already parsed or needs parsing
      const info = typeof message.eventData === 'string' 
        ? JSON.parse(message.eventData) 
        : message.eventData;
        
      console.log('Parsed info:', info);
      callbacks.onInfo?.(info);
    }
  } catch (error) {
    console.error('Failed to parse WebView message:', error, event.nativeEvent.data);
  }
};

// Send response back to WebView
export const sendResponseToWebView = (
  webViewRef: any,
  response: WebViewResponse
) => {
  console.log('Sending response to WebView:', response);
  
  if (!webViewRef.current) {
    console.error('WebView reference is null, cannot send response');
    return;
  }
  
  // Use a more reliable injection method with proper error handling
  const script = `
    (function() {
      try {
        console.log('Processing response in WebView:', ${JSON.stringify(JSON.stringify(response))});
        
        // Make sure the response channel exists
        if (typeof window.responseChannel !== 'function') {
          console.error('responseChannel is not defined or not a function');
          return;
        }
        
        // Call the response channel with the response object
        window.responseChannel(${JSON.stringify(response)});
        console.log('Response processed');
      } catch (e) {
        console.error('Error in WebView when processing response:', e);
      }
      true;
    })();
  `;
  
  webViewRef.current.injectJavaScript(script);
};