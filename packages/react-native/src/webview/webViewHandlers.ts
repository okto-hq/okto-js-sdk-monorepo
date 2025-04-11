// WebViewRequestHandler.ts
import { v4 as uuidv4 } from 'uuid';
import { WebViewBridge } from './webViewBridge.js';
import type { WebViewRequest, WebViewResponse } from './types.js';

export class WebViewRequestHandler {
  private bridge: WebViewBridge;
  private navigationCallback: () => void;

  constructor(bridge: WebViewBridge, navigationCallback: () => void) {
    this.bridge = bridge;
    this.navigationCallback = navigationCallback;
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
      switch (request.method) {
        case 'okto_sdk_login':
          await this.handleLoginRequest(request);
          break;
        default:
          throw new Error(`Unknown method: ${request.method}`);
      }
    } catch (error) {
      console.error('Error handling request:', error);
      this.bridge.sendResponse({
        id: request.id,
        method: request.method,
        data: {
          ...request.data,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Handle login request
  private handleLoginRequest = async (request: WebViewRequest) => {
    console.log('Handling login request:', request.data);
    const { provider, whatsapp_number, type, otp, token } = request.data;

    // Handle different login request types
    switch (type) {
      case 'request_otp':
        await this.handleRequestOTP(request);
        break;
      case 'verify_otp':
        await this.handleVerifyOTP(request);
        break;
      case 'resend_otp':
        await this.handleResendOTP(request);
        break;
      case 'close_webview':
        await this.handleCloseWebView(request);
        break;
      default:
        throw new Error(`Unknown login request type: ${type}`);
    }
  };

  private handleRequestOTP = async (request: WebViewRequest) => {
    const { provider, whatsapp_number } = request.data;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const tempToken = uuidv4();

      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          token: tempToken,
        },
      };

      console.log('Sending OTP request response:', response);
      this.bridge.sendResponse(response);
    } catch (error) {
      console.error('Error requesting OTP:', error);
      this.bridge.sendResponse({
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
        },
        error: error instanceof Error ? error.message : 'Failed to request OTP',
      });
    }
  };

  private handleVerifyOTP = async (request: WebViewRequest) => {
    const { provider, whatsapp_number, otp, token } = request.data;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const authToken = `auth-${uuidv4()}`;

      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          otp,
          token: authToken,
          message: 'Authentication successful',
        },
      };

      console.log('Sending OTP verification response:', response);
      this.bridge.sendResponse(response);

      // Close the WebView after successful verification
      setTimeout(() => {
        this.navigationCallback();
      }, 500);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      this.bridge.sendResponse({
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          otp,
          token,
        },
        error: error instanceof Error ? error.message : 'Failed to verify OTP',
      });
    }
  };

  private handleResendOTP = async (request: WebViewRequest) => {
    const { provider, whatsapp_number, token } = request.data;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newToken = uuidv4();

      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          token: newToken,
          message: 'OTP resent successfully',
        },
      };

      console.log('Sending OTP resend response:', response);
      this.bridge.sendResponse(response);
    } catch (error) {
      console.error('Error resending OTP:', error);
      this.bridge.sendResponse({
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          token,
        },
        error: error instanceof Error ? error.message : 'Failed to resend OTP',
      });
    }
  };

  private handleCloseWebView = async (request: WebViewRequest) => {
    try {
      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          type: 'close_webview',
          message: 'WebView closed successfully',
        },
      };

      console.log('Processing WebView close request:', response);
      this.bridge.sendResponse(response);

      // Close the WebView after sending response
      setTimeout(() => {
        this.navigationCallback();
      }, 300);
    } catch (error) {
      console.error('Error closing WebView:', error);
      this.bridge.sendResponse({
        id: request.id,
        method: request.method,
        data: {
          type: 'close_webview',
        },
        error:
          error instanceof Error ? error.message : 'Failed to close WebView',
      });
    }
  };

  // Handle info messages
  private handleInfo = (info: WebViewRequest) => {
    console.log('Received info from WebView:', info);
  };
}
