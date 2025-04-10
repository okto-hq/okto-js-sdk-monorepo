// WebViewBridge.ts
import type { MutableRefObject } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { WebViewRequest, WebViewResponse } from './types.js';

export class WebViewBridge {
  private webViewRef: MutableRefObject<WebView | null>;

  constructor(webViewRef: MutableRefObject<WebView | null>) {
    this.webViewRef = webViewRef;
  }

  public handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const rawData = event.nativeEvent.data;
      console.log('Raw message from WebView:', rawData);

      const message = JSON.parse(rawData);

      if (message.eventName === 'requestChannel') {
        const request =
          typeof message.eventData === 'string'
            ? JSON.parse(message.eventData)
            : message.eventData;

        console.log('Parsed request:', request);
        this.onRequest?.(request);
      } else if (message.eventName === 'infoChannel') {
        const info =
          typeof message.eventData === 'string'
            ? JSON.parse(message.eventData)
            : message.eventData;

        console.log('Parsed info:', info);
        this.onInfo?.(info);
      }
    } catch (error) {
      console.error(
        'Failed to parse WebView message:',
        error,
        event.nativeEvent.data,
      );
    }
  };

  // Callback setters
  private onRequest: ((request: WebViewRequest) => void) | null = null;
  private onInfo: ((info: WebViewRequest) => void) | null = null;

  public setRequestHandler(handler: (request: WebViewRequest) => void) {
    this.onRequest = handler;
  }

  public setInfoHandler(handler: (info: WebViewRequest) => void) {
    this.onInfo = handler;
  }

  // Send response back to WebView
  public sendResponse = (response: WebViewResponse) => {
    console.log('Sending response to WebView:', response);
  
    if (!this.webViewRef.current) {
      console.error('WebView reference is null, cannot send response');
      return;
    }
  
    // Use the correct format that the web expects
    const script = `
      (function() {
        try {
          const response = ${JSON.stringify(response)};
          console.log('Processing response in WebView:', response);
          
          if (typeof window.responseChannel === 'function') {
            window.responseChannel(response);
            console.log('Response processed');
          } else {
            console.error('responseChannel is not defined or not a function');
          }
        } catch (e) {
          console.error('Error in WebView when processing response:', e);
        }
      })();
    `;
  
    this.webViewRef.current.injectJavaScript(script);
  };

  // Get injected JavaScript for WebView initialization
  public getInjectedJavaScript(): string {
    return `
      (function() {
        // Define communication channels
        window.requestChannel = {
        console.log('request channel:');
          postMessage: function(message) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              eventName: 'requestChannel',
              eventData: message
            }));
          }
        };
        
        window.infoChannel = {
        console.log('info channel:');
          postMessage: function(message) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              eventName: 'infoChannel',
              eventData: message
            }));
          }
        };
        
        window.responseChannel = {
        console.log('responseChannel');
          postMessage: function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              eventName: 'infoChannel',
              eventData: response
            }));
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
  }

  // Reinitialize bridge after page load
  public reinitializeBridge(): void {
    if (!this.webViewRef.current) return;

    const script = `
      (function() {
        console.log('Re-initializing bridge after page load');
        // Check if bridge needs to be initialized
        if (!window.requestChannel || !window.infoChannel || !window.responseChannel) {
          ${this.getInjectedJavaScript()}
        }
        true;
      })();
    `;

    this.webViewRef.current.injectJavaScript(script);
  }
}
