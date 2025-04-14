// ==============================
// WebViewRequestHandler.ts
// Handles requests from WebView and sends appropriate responses
// ==============================

import { v4 as uuidv4 } from 'uuid';
import { WebViewBridge } from '../webViewBridge.js';
import type { WebViewRequest, WebViewResponse } from '../types.js';
import { WhatsAppAuthentication } from '@okto_web3/core-js-sdk/authentication';
import type { OktoClient } from '@okto_web3/core-js-sdk';

/**
 * Handles and processes requests from WebView
 */
export class AuthWebViewRequestHandler {
  private bridge: WebViewBridge;
  private navigationCallback: () => void;
  private oktoClient: OktoClient;

  /**
   * Creates a new WebViewRequestHandler
   * @param bridge The WebViewBridge instance to use for communication
   * @param navigationCallback Function to navigate back/close WebView
   * @param oktoClient The OktoClient instance for authentication
   */
  constructor(
    bridge: WebViewBridge, 
    navigationCallback: () => void,
    oktoClient: OktoClient
  ) {
    this.bridge = bridge;
    this.navigationCallback = navigationCallback;
    this.oktoClient = oktoClient;
    this.initialize();
  }

  /**
   * Sets up request and info handlers
   */
  private initialize(): void {
    this.bridge.setRequestHandler(this.handleRequest);
    this.bridge.setInfoHandler(this.handleInfo);
  }

  /**
   * Processes incoming requests from WebView
   * @param request The request to process
   */
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

  /**
   * Processes login requests based on their type
   * @param request The login request to process
   */
  private handleLoginRequest = async (request: WebViewRequest) => {
    console.log('Handling login request:', request.data);
    const { type } = request.data;

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

  /**
   * Processes OTP request
   * @param request The OTP request
   */
  private handleRequestOTP = async (request: WebViewRequest) => {
    const { provider, whatsapp_number, country_short_name } = request.data;

    try {
      if (provider !== 'whatsapp') {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      if (!whatsapp_number) {
        throw new Error('WhatsApp number is required');
      }
      // Use the WhatsAppAuthentication class to send OTP
      const otpResponse = await WhatsAppAuthentication.sendOTP(
        this.oktoClient,
        whatsapp_number,
        country_short_name || 'IN' // Default to IN if not provided
      );

      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          token: otpResponse.token,
          message: 'OTP sent successfully',
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

  /**
   * Processes OTP verification
   * @param request The OTP verification request
   */
  private handleVerifyOTP = async (request: WebViewRequest) => {
    const { provider, whatsapp_number, otp, token, country_short_name } = request.data;

    try {
      if (provider !== 'whatsapp') {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      if (!whatsapp_number || !token || !otp) {
        throw new Error('WhatsApp number is required');
      }

      // Use the WhatsAppAuthentication class to verify OTP
      const verifyResponse = await WhatsAppAuthentication.verifyOTP(
        this.oktoClient,
        whatsapp_number,
        country_short_name || 'IN', // Default to IN if not provided
        token,
        otp
      );

      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          otp,
          token: verifyResponse.auth_token || token,
          message: 'Authentication successful',
          // user_info: verifyResponse.user_info,
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

  /**
   * Processes OTP resend request
   * @param request The OTP resend request
   */
  private handleResendOTP = async (request: WebViewRequest) => {
    const { provider, whatsapp_number, token, country_short_name } = request.data;

    try {
      if (provider !== 'whatsapp') {
        throw new Error(`Unsupported provider: ${provider}`);
      }
      if (!whatsapp_number || !token) {
        throw new Error('WhatsApp number is required');
      }

      // Use the WhatsAppAuthentication class to resend OTP
      const resendResponse = await WhatsAppAuthentication.resendOTP(
        this.oktoClient,
        whatsapp_number,
        country_short_name || 'IN', // Default to IN if not provided
        token
      );

      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          token: resendResponse.token || token,
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

  /**
   * Processes WebView close request
   * @param request The close WebView request
   */
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

  /**
   * Processes info messages from WebView
   * @param info The info message
   */
  private handleInfo = (info: WebViewRequest) => {
    console.log('Received info from WebView:', info);
  };
}