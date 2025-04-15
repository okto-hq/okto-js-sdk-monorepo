// WebViewRequestHandler.ts
import { v4 as uuidv4 } from 'uuid';
import { WebViewBridge } from './webViewBridge.js';
import type { WebViewRequest, WebViewResponse } from './types.js';
import type { OktoClient } from '@okto_web3/core-js-sdk';

export class WebViewRequestHandler {
  private bridge: WebViewBridge;
  private navigationCallback: () => void;
  private oktoClient: OktoClient;

  constructor(bridge: WebViewBridge, navigationCallback: () => void, oktoClient: OktoClient) {
    this.bridge = bridge;
    this.navigationCallback = navigationCallback;
    this.oktoClient = oktoClient;
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

    if (!whatsapp_number) {
      throw new Error('WhatsApp number is required');
    }

    try {
      // Use OktoClient's WhatsApp sendOTP method
      const otpResponse = await this.oktoClient.sendOTP(whatsapp_number, 'whatsapp');
      
      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          token: otpResponse.token,
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

    if (!whatsapp_number) {
      throw new Error('WhatsApp number is required');
    }

    if (!otp) {
      throw new Error('OTP is required');
    }

    try {
      if (!token) {
        throw new Error('Token is required');
      }
      // Use OktoClient's WhatsApp loginUsingWhatsApp method
      const result = await this.oktoClient.loginUsingWhatsApp(
        whatsapp_number,
        otp,
        token,
        (sessionConfig: any) => {
          console.log('Login successful, session established:', sessionConfig);
        }
      );

      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          otp,
          token: result ? 'auth-success' : 'auth-failed',
          message: result ? 'Authentication successful' : 'Authentication failed',
        },
      };

      console.log('Sending OTP verification response:', response);
      this.bridge.sendResponse(response);

      // Close the WebView after successful verification
      if (result) {
        setTimeout(() => {
          this.navigationCallback();
        }, 500);
      }
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

    if (!whatsapp_number) {
      throw new Error('WhatsApp number is required');
    }

    if (!token) {
      throw new Error('Token is required');
    }

    try {
      // Use OktoClient's WhatsApp resendOTP method
      const resendResponse = await this.oktoClient.resendOTP(
        whatsapp_number,
        token,
        'whatsapp'
      );

      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          token: resendResponse.token,
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