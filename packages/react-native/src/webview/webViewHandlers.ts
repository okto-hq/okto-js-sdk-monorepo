// WebViewRequestHandler.ts
import { v4 as uuidv4 } from 'uuid';
import { WebViewBridge } from './webViewBridge.js';
import type { WebViewRequest, WebViewResponse } from './types.js';

export class WebViewRequestHandler {
  private bridge: WebViewBridge;

  constructor(bridge: WebViewBridge) {
    this.bridge = bridge;
    this.initialize();
  }

  private initialize(): void {
    this.bridge.setRequestHandler(this.handleRequest);
    this.bridge.setInfoHandler(this.handleInfo);
  }

  // Main request handler
  private handleRequest = async (request: WebViewRequest) => {
    console.log('Received request from WebView:', request);

    try {
      // Process the request based on method
      switch (request.method) {
        case 'okto_sdk_login':
          await this.handleLoginRequest(request);
          break;
        // Add other method handlers as needed
        default:
          throw new Error(`Unknown method: ${request.method}`);
      }
    } catch (error) {
      console.error('Error handling request:', error);
      // Send error response
      this.bridge.sendResponse({
        id: request.id,
        method: request.method,
        provider: request.data.provider,
        whatsapp_number: request.data.whatsapp_number,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Handle login request
  private handleLoginRequest = async (request: WebViewRequest) => {
    console.log('Handling login request:', request.data);
    const { provider, whatsapp_number } = request.data;

    // Simulate login process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Send success response
    const response: WebViewResponse = {
      id: request.id,
      method: request.method,
      provider,
      whatsapp_number,
      token: `d0c2e95e-1999-5afe-8d56-83a5e79f8aa8`,
    };

    console.log('Sending response:', response);
    this.bridge.sendResponse(response);
    console.log('Response successfully sent to WebView');
  };

  // Handle info messages
  private handleInfo = (info: WebViewRequest) => {
    console.log('Received info from WebView:', info);

    // Process info messages (logging, analytics, etc.)
  };
}
