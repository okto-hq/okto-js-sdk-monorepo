// WebViewBridge.ts
import type { MutableRefObject } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { WebViewRequest, WebViewResponse } from './types.js';

/**
 * WebViewBridge - Manages communication between React Native and WebView
 *
 * This class provides a bidirectional communication channel between the native
 * application and web content loaded in a WebView. It handles message parsing,
 * routing, and response delivery.
 */
export class WebViewBridge {
  private webViewRef: MutableRefObject<WebView | null>;

  // Callback handlers
  private onRequest: ((request: WebViewRequest) => void) | null = null;
  private onInfo: ((info: WebViewRequest) => void) | null = null;

  constructor(webViewRef: MutableRefObject<WebView | null>) {
    this.webViewRef = webViewRef;
  }

  /**
   * Process incoming messages from the WebView
   *
   * Parses messages and routes them to appropriate handlers based on event channel
   * @param event WebView message event containing data from web content
   */
  public handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const rawData = event.nativeEvent.data;
      console.log('Raw message from WebView:', rawData);

      // Parse the message JSON
      const message = JSON.parse(rawData);

      // Route message based on channel type
      if (message.eventName === 'requestChannel') {
        // Handle request messages
        const request =
          typeof message.eventData === 'string'
            ? JSON.parse(message.eventData)
            : message.eventData;

        console.log('Parsed request:', request);
        this.onRequest?.(request);
      } else if (message.eventName === 'infoChannel') {
        // Handle info messages
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

  public setRequestHandler(handler: (request: WebViewRequest) => void) {
    this.onRequest = handler;
  }

  public setInfoHandler(handler: (info: WebViewRequest) => void) {
    this.onInfo = handler;
  }

  public sendResponse = (response: WebViewResponse) => {
    console.log('Sending response to WebView:', response);

    if (!this.webViewRef.current) {
      console.error('WebView reference is null, cannot send response');
      return;
    }

    // Create JavaScript to execute in WebView context
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

    // Execute script in WebView
    this.webViewRef.current.injectJavaScript(script);
  };

  /**
   * Generate JavaScript code to inject into WebView for communication setup
   *
   * This creates communication channels and callback handling in the WebView
   * @returns JavaScript code as string
   */
  public getInjectedJavaScript(): string {
    return `
      (function() {
        // Define communication channels for sending messages from WebView to native
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
        
        // Store pending requests to match responses with callbacks
        window.pendingRequests = window.pendingRequests || {};
        
        // Define response handler for receiving messages from native to WebView
        window.responseChannel = function(response) {
          console.log('Response received in WebView:', response);
          
          // Find and execute the callback for this response
          if (window.pendingRequests && window.pendingRequests[response.id]) {
            window.pendingRequests[response.id](response);
            delete window.pendingRequests[response.id]; // Clean up after handling
          } else {
            console.warn('No pending request found for response ID:', response.id);
          }
        };
        
        // Notify web content that bridge is ready after page load
        window.addEventListener('load', function() {
          setTimeout(function() {
            console.log('Bridge is ready');
            if (window.onBridgeReady) {
              window.onBridgeReady();
            }
          }, 300); // Small delay to ensure page is fully loaded
        });
        
        console.log('Communication bridge initialized');
        true; // Return true to indicate successful execution
      })();
    `;
  }

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
