// In src/core/webview/communication.ts
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
    const message = JSON.parse(event.nativeEvent.data);
    
    // Determine if it's a request or info message
    if (message.eventName === 'requestChannel') {
      const request = JSON.parse(message.eventData);
      callbacks.onRequest?.(request);
    } else if (message.eventName === 'infoChannel') {
      const info = JSON.parse(message.eventData);
      callbacks.onInfo?.(info);
    }
  } catch (error) {
    console.error('Failed to parse WebView message:', error);
  }
};

// Send response back to WebView
export const sendResponseToWebView = (
  webViewRef: any,
  response: WebViewResponse
) => {
  const message = {
    eventName: 'responseChannel',
    eventData: JSON.stringify(response)
  };
  
  webViewRef.current?.injectJavaScript(`
    (function() {
      if (window.responseChannel && typeof window.responseChannel === 'function') {
        window.responseChannel(${JSON.stringify(response)});
      }
      true;
    })();
  `);
};