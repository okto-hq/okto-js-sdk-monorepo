// WebViewRequestHandler.ts
import { WebViewBridge } from '../webViewBridge.js';
import type { WebViewRequest, WebViewResponse } from '../types.js';
import type { OktoClient } from '@okto_web3/core-js-sdk';
import { Platform } from 'react-native';
import {
  createExpoBrowserHandler,
  type AuthPromiseResolver,
} from '../../utils/authBrowserUtils.js';
import { setStorage } from '../../utils/storageUtils.js';
import * as Clipboard from 'expo-clipboard';

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
  private authPromiseResolverRef: { current: AuthPromiseResolver } = {
    current: null,
  };

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
   * Further routes login requests based on the type field and provider
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
      case 'paste_otp':
        await this.handlePasteOTP(request);
        break;
      case 'close_webview':
        await this.handleCloseWebView(request);
        break;
      default:
        await this.handleGoogleLogin(request);
        break;
    }
  };

  // Handle Google provider directly with no OTP flow
  private handleGoogleLogin = async (request: WebViewRequest) => {
    const { provider } = request.data;
    if (provider === 'google') {
      const redirectUrl = 'oktosdk://auth';
      await this.oktoClient.loginUsingSocial(
        provider,
        {
          client_url: redirectUrl,
          platform: Platform.OS,
        },
        createExpoBrowserHandler(redirectUrl, this.authPromiseResolverRef),
      );
      return;
    }
  };

  /**
   * Handle request to generate a new OTP for authentication
   *
   * Uses Okto SDK to send an OTP via supported channels
   * @param request OTP request data containing contact information
   */
  private handleRequestOTP = async (request: WebViewRequest) => {
    const { provider } = request.data;

    try {
      let otpResponse;
      let contactInfo;
      let contactType;

      switch (provider) {
        case 'whatsapp':
          const { whatsapp_number } = request.data;
          if (!whatsapp_number) {
            throw new Error('WhatsApp number is required');
          }
          contactInfo = whatsapp_number;
          contactType = 'whatsapp';
          break;

        case 'email':
          const { email } = request.data;
          if (!email) {
            throw new Error('Email address is required');
          }
          contactInfo = email;
          contactType = 'email';
          break;

        default:
          throw new Error(`Unsupported provider for OTP: ${provider}`);
      }

      // Call Okto SDK to send OTP
      otpResponse = await this.oktoClient.sendOTP(
        contactInfo,
        contactType as 'email' | 'whatsapp',
      );

      // Prepare success response with token
      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          ...(provider === 'whatsapp' ? { whatsapp_number: contactInfo } : {}),
          ...(provider === 'email' ? { email: contactInfo } : {}),
          token: otpResponse.token,
        },
      };

      console.log(`Sending ${provider} OTP request response:`, response);
      this.bridge.sendResponse(response);
    } catch (error) {
      // Handle and report errors back to WebView
      console.error(`Error requesting OTP for ${provider}:`, error);
      this.bridge.sendResponse({
        id: request.id,
        method: request.method,
        data: request.data,
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
    const { provider, otp, token } = request.data;

    try {
      if (!token) {
        throw new Error('Token is required');
      }

      if (!otp) {
        throw new Error('OTP is required');
      }

      let result;
      let contactInfo;

      switch (provider) {
        case 'whatsapp':
          const { whatsapp_number } = request.data;
          if (!whatsapp_number) {
            throw new Error('WhatsApp number is required');
          }
          contactInfo = whatsapp_number;

          // Verify OTP via Okto SDK for WhatsApp
          result = await this.oktoClient.loginUsingWhatsApp(
            contactInfo,
            otp,
            token,
            (sessionConfig: any) => {
              console.log(
                'WhatsApp login successful, session established:',
                sessionConfig,
              );
              setStorage('okto_session', JSON.stringify(sessionConfig));
            },
          );
          break;

        case 'email':
          const { email } = request.data;
          if (!email) {
            throw new Error('Email address is required');
          }
          contactInfo = email;

          // Verify OTP via Okto SDK for Email
          result = await this.oktoClient.loginUsingEmail(
            contactInfo,
            otp,
            token,
            (sessionConfig: any) => {
              console.log(
                'Email login successful, session established:',
                sessionConfig,
              );
              setStorage('okto_session', JSON.stringify(sessionConfig));
            },
          );
          break;

        default:
          throw new Error(
            `Unsupported provider for OTP verification: ${provider}`,
          );
      }

      // Prepare response with authentication result
      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          ...(provider === 'whatsapp' ? { whatsapp_number: contactInfo } : {}),
          ...(provider === 'email' ? { email: contactInfo } : {}),
          otp,
          token: result ? 'auth-success' : 'auth-failed',
          message: result
            ? 'Authentication successful'
            : 'Authentication failed',
        },
      };

      console.log(`Sending ${provider} OTP verification response:`, response);
      this.bridge.sendResponse(response);

      // Close WebView after successful authentication
      if (result) {
        setTimeout(() => {
          this.navigationCallback();
        }, 1000); // Short delay to allow WebView to process response
      }
    } catch (error) {
      // Handle and report verification errors
      console.error(`Error verifying OTP for ${provider}:`, error);
      this.bridge.sendResponse({
        id: request.id,
        method: request.method,
        data: request.data,
        error: error instanceof Error ? error.message : 'Failed to verify OTP',
      });
    }
  };

  /**
   * Handle request to resend OTP
   *
   * Uses Okto SDK to resend an OTP via supported channels
   * @param request Resend request data containing contact information and token
   */
  private handleResendOTP = async (request: WebViewRequest) => {
    const { provider, token } = request.data;

    if (!token) {
      throw new Error('Token is required');
    }

    try {
      let resendResponse;
      let contactInfo;
      let contactType;

      switch (provider) {
        case 'whatsapp':
          const { whatsapp_number } = request.data;
          if (!whatsapp_number) {
            throw new Error('WhatsApp number is required');
          }
          contactInfo = whatsapp_number;
          contactType = 'whatsapp';
          break;

        case 'email':
          const { email } = request.data;
          if (!email) {
            throw new Error('Email address is required');
          }
          contactInfo = email;
          contactType = 'email';
          break;

        default:
          throw new Error(
            `Unsupported provider for resending OTP: ${provider}`,
          );
      }

      // Call Okto SDK to resend OTP
      resendResponse = await this.oktoClient.resendOTP(
        contactInfo,
        token,
        contactType as 'email' | 'whatsapp',
      );

      // Prepare success response with new token
      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          ...(provider === 'whatsapp' ? { whatsapp_number: contactInfo } : {}),
          ...(provider === 'email' ? { email: contactInfo } : {}),
          token: resendResponse.token,
          message: `OTP resent successfully via ${provider}`,
        },
      };

      console.log(`Sending ${provider} OTP resend response:`, response);
      this.bridge.sendResponse(response);
    } catch (error) {
      // Handle and report resend errors
      console.error(`Error resending OTP for ${provider}:`, error);
      this.bridge.sendResponse({
        id: request.id,
        method: request.method,
        data: request.data,
        error: error instanceof Error ? error.message : 'Failed to resend OTP',
      });
    }
  };

  private handlePasteOTP = async (request: WebViewRequest) => {
    const { provider } = request.data;

    try {
      const otpFromClipboard = await this.getOTPFromClipboard();
      console.log(
        `Pasting OTP from clipboard for ${provider}:`,
        otpFromClipboard,
      );

      if (!otpFromClipboard) {
        throw new Error('No valid OTP found in clipboard');
      }

      // Send the OTP back to WebView
      const response: WebViewResponse = {
        id: request.id,
        method: request.method,
        data: {
          provider,
          type: 'paste_otp',
          message: otpFromClipboard,
        },
      };

      console.log(`Sending OTP from clipboard for ${provider}:`, response);
      this.bridge.sendResponse(response);
    } catch (error) {
      console.error(`Error pasting OTP for ${provider}:`, error);
      this.bridge.sendResponse({
        id: request.id,
        method: request.method,
        data: {
          provider,
          type: 'paste_otp',
        },
        error: error instanceof Error ? error.message : 'Failed to paste OTP',
      });
    }
  };

  //TODO: check this implementation once
  private async getOTPFromClipboard(): Promise<string | null> {
    try {
      const content = await Clipboard.getStringAsync();
      console.log('Clipboard content:', content);
      const otpMatch = content.match(/\b\d{4,6}\b/);
      return otpMatch ? otpMatch[0] : null;
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      return null;
    }
  }

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
