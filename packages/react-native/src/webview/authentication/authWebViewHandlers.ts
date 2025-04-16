// WebViewRequestHandler.ts
import { WebViewBridge } from '../webViewBridge.js';
import type { WebViewRequest, WebViewResponse } from '../types.js';
import type { OktoClient } from '@okto_web3/core-js-sdk';
import { setStorage } from '../../utils/storageUtils.js';

/**
 * AuthWebViewRequestHandler - Handles authentication requests from WebView
 *
 * This class processes authentication-related requests coming from the WebView,
 * such as OTP generation, verification, and other authentication flows using
 * the Okto SDK.
 */
export class AuthWebViewRequestHandler {
  private bridge: WebViewBridge;
  private navigationCallback: () => void;
  private oktoClient: OktoClient;

  constructor(
    bridge: WebViewBridge,
    navigationCallback: () => void,
    oktoClient: OktoClient,
  ) {
    this.bridge = bridge;
    this.navigationCallback = navigationCallback;
    this.oktoClient = oktoClient;
    this.initialize();
  }

  private initialize(): void {
    this.bridge.setRequestHandler(this.handleRequest);
    this.bridge.setInfoHandler(this.handleInfo);
  }

  /**
   * Main request handler - processes all requests from WebView
   *
   * Routes requests to specific handlers based on the method
   * @param request Request data from WebView
   */
  private handleRequest = async (request: WebViewRequest) => {
    console.log('Received request from WebView:', request);

    try {
      // Route request based on method
      switch (request.method) {
        case 'okto_sdk_login':
          await this.handleLoginRequest(request);
          break;
        default:
          throw new Error(`Unknown method: ${request.method}`);
      }
    } catch (error) {
      // Handle and report any errors back to WebView
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
   * Handle login-specific requests
   *
   * Further routes login requests based on the type field
   * @param request Login request data from WebView
   */
  private handleLoginRequest = async (request: WebViewRequest) => {
    console.log('Handling login request:', request.data);
    const { type } = request.data;

    // Route to specific handler based on login request type
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
   * Handle request to generate a new OTP for authentication
   *
   * Uses Okto SDK to send an OTP via WhatsApp
   * @param request OTP request data containing phone number
   */
  private handleRequestOTP = async (request: WebViewRequest) => {
    const { provider, whatsapp_number } = request.data;

    if (!whatsapp_number) {
      throw new Error('WhatsApp number is required');
    }

    try {
      // Call Okto SDK to send OTP to provided WhatsApp number
      const otpResponse = await this.oktoClient.sendOTP(
        whatsapp_number,
        'whatsapp',
      );

      // Prepare success response with token
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
      // Handle and report errors back to WebView
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
   * Handle verification of OTP entered by user
   *
   * Validates OTP via Okto SDK and establishes session on success
   * @param request OTP verification data containing code and token
   */
  private handleVerifyOTP = async (request: WebViewRequest) => {
    const { provider, whatsapp_number, otp, token } = request.data;

    // Validate required fields
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

      // Verify OTP via Okto SDK
      const result = await this.oktoClient.loginUsingWhatsApp(
        whatsapp_number,
        otp,
        token,
        (sessionConfig: any) => {
          console.log('Login successful, session established:', sessionConfig);
          setStorage('okto_session', JSON.stringify(sessionConfig));
        },
      );

      // Prepare response with authentication result
      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          whatsapp_number,
          otp,
          token: result ? 'auth-success' : 'auth-failed',
          message: result
            ? 'Authentication successful'
            : 'Authentication failed',
        },
      };

      console.log('Sending OTP verification response:', response);
      this.bridge.sendResponse(response);

      // Close WebView after successful authentication
      if (result) {
        setTimeout(() => {
          this.navigationCallback();
        }, 500); // Short delay to allow WebView to process response
      }
    } catch (error) {
      // Handle and report verification errors
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
   * Handle request to resend OTP
   *
   * Uses Okto SDK to resend an OTP via WhatsApp
   * @param request Resend request data containing phone number and token
   */
  private handleResendOTP = async (request: WebViewRequest) => {
    const { provider, whatsapp_number, token } = request.data;

    // Validate required fields
    if (!whatsapp_number) {
      throw new Error('WhatsApp number is required');
    }

    if (!token) {
      throw new Error('Token is required');
    }

    try {
      // Call Okto SDK to resend OTP
      const resendResponse = await this.oktoClient.resendOTP(
        whatsapp_number,
        token,
        'whatsapp',
      );

      // Prepare success response with new token
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
      // Handle and report resend errors
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
   * Handle request to close the WebView
   *
   * Used when web content needs to programmatically close the WebView
   * @param request Close request data
   */
  private handleCloseWebView = async (request: WebViewRequest) => {
    try {
      // Prepare response acknowledging close request
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

      // Close WebView after sending confirmation
      setTimeout(() => {
        this.navigationCallback();
      }, 300);
    } catch (error) {
      // Handle and report close errors
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

  private handleInfo = (info: WebViewRequest) => {
    console.log('Received info from WebView:', info);
  };
}
