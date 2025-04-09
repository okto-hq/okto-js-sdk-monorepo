// src/webview/channels.ts

import type { HostRequest, HostResponse, WebViewResponseCallback } from '../types/webview.js';
import { v4 as uuid } from 'uuid';

// Map to store callbacks for pending requests
const pendingRequests = new Map<string, WebViewResponseCallback>();

/**
 * Handles responses coming from the WebView
 * @param response The response from the WebView
 */
export const handleWebViewResponse = (response: HostResponse): void => {
  const callback = pendingRequests.get(response.id);
  if (callback) {
    callback(response);
    
    // Clean up if it's a final response (success or error)
    if (response.data.status !== 'loading') {
      pendingRequests.delete(response.id);
    }
  }
};

/**
 * Sends a request to the WebView and registers a callback for the response
 * @param webViewRef Reference to the WebView component
 * @param request The request to send
 * @param callback Callback function to handle the response
 */
export const sendRequest = (
  webViewRef: any,
  request: Omit<HostRequest, 'id'>,
  callback?: WebViewResponseCallback
): string => {
  const requestId = uuid();
  const fullRequest: HostRequest = {
    ...request,
    id: requestId,
  };

  if (callback) {
    pendingRequests.set(requestId, callback);
  }

  // Send the message to the WebView
  webViewRef.current?.injectJavaScript(`
    window.requestChannel && window.requestChannel.postMessage(${JSON.stringify(fullRequest)});
    true;
  `);

  return requestId;
};

/**
 * Sends an inform message to the WebView without expecting a response
 * @param webViewRef Reference to the WebView component
 * @param request The information to send
 */
export const sendInform = (
  webViewRef: any,
  request: Omit<HostRequest, 'id'>
): void => {
  const informRequest: HostRequest = {
    ...request,
    id: uuid(),
  };

  // Send the message to the WebView
  webViewRef.current?.injectJavaScript(`
    window.infoChannel && window.infoChannel.postMessage(${JSON.stringify(informRequest)});
    true;
  `);
};

/**
 * Sets up the response channel in the WebView
 * @param webViewRef Reference to the WebView component
 */
export const setupResponseChannel = (webViewRef: any): void => {
  webViewRef.current?.injectJavaScript(`
    window.responseChannel = function(data) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        channel: 'responseChannel',
        data: data
      }));
    };
    true;
  `);
};