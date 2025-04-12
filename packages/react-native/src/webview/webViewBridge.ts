// ==============================
// WebViewBridge.ts
// Handles communication between React Native and WebView
// ==============================

import type { MutableRefObject } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { WebViewRequest, WebViewResponse } from './types.js';

/**
 * Bridge class to handle communication between React Native and WebView
 */
export class WebViewBridge {
  private webViewRef: MutableRefObject<WebView | null>;
  private onRequest: ((request: WebViewRequest) => void) | null = null;
  private onInfo: ((info: WebViewRequest) => void) | null = null;

  /**
   * Creates a new WebViewBridge instance
   * @param webViewRef Reference to the WebView component
   */
  constructor(webViewRef: MutableRefObject<WebView | null>) {
    this.webViewRef = webViewRef;
  }

  /**
   * Processes messages received from the WebView
   * @param event WebView message event
   */
  public handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const rawData = event.nativeEvent.data;
      console.log('Raw message from WebView:', rawData);

      const message = JSON.parse(rawData);

      // Handle different message types
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

  /**
   * Sets the handler for request messages
   * @param handler Function to process request messages
   */
  public setRequestHandler(handler: (request: WebViewRequest) => void) {
    this.onRequest = handler;
  }

  /**
   * Sets the handler for info messages
   * @param handler Function to process info messages
   */
  public setInfoHandler(handler: (info: WebViewRequest) => void) {
    this.onInfo = handler;
  }

  /**
   * Sends a response back to the WebView
   * @param response Response to send to WebView
   */
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

  /**
   * Returns JavaScript to be injected into WebView for communication setup
   */
  public getInjectedJavaScript(): string {
    return `
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
            delete window.pendingRequests[response.id];
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
  }

  /**
   * Reinitializes the bridge after page load
   */
  public reinitializeBridge(): void {
    if (!this.webViewRef.current) return;

    const script = `
      (function() {
        console.log('Re-initializing bridge after page load');
        if (!window.requestChannel || !window.infoChannel || !window.responseChannel) {
          ${this.getInjectedJavaScript()}
        }
        true;
      })();
    `;

    this.webViewRef.current.injectJavaScript(script);
  }
}
