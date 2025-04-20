import type { WebViewManager } from '../webViewManager.js';
import type { WebViewRequestHandler } from '../types.js';
import type { OktoClient } from 'src/core/index.js';

/**
 * @description
 * Handles requests from the WebView and sends appropriate responses.
 * This class is responsible for managing the communication between the WebView and the main application.
 * It processes different types of requests such as OTP requests, OTP verification, and WebView closure.
 * It also manages the WebView lifecycle.
 */
export class AuthRequestHandler {
  private webViewManager: WebViewManager;
  private oktoClient?: OktoClient;

  constructor(webViewManager: WebViewManager, oktoClient?: OktoClient) {
    this.oktoClient = oktoClient;
    this.webViewManager = webViewManager;
  }

  public handleRequest: WebViewRequestHandler = (actualData: any) => {
    console.log('Received request:', actualData);
    if (!actualData?.data?.type) return;

    const baseResponse = {
      id: actualData.id || 'uuid-for-webview',
      method: actualData.method || 'okto_sdk_login',
    };
    console.log('Base response:', baseResponse);
    console.log('Actual data:', actualData);
    console.log('Request type:', actualData.data.type);
    console.log('Request data:', actualData.data);
    console.log('Request provider:', actualData.data.provider);
    switch (actualData.data.type) {
      case 'request_otp':
        this.handleSendOtp(
          actualData.data.provider == 'email'
            ? actualData.data.email
            : actualData.data.whatsapp_number,
          actualData.data.provider,
          baseResponse,
        );
        break;

      case 'verify_otp':
        console.log('Verifying OTP:', actualData.data.otp);
        this.handleVerifyOtp(
          actualData.data.provider == 'email'
            ? actualData.data.email
            : actualData.data.whatsapp_number,
          actualData.data.otp,
          actualData.data.provider,
          actualData.data.token,
          baseResponse,
        );
        break;

      case 'resend_otp':
        this.webViewManager.sendResponse(
          baseResponse.id,
          baseResponse.method,
          {
            success: true,
            message: 'OTP resent successfully',
          },
          null,
        );
        break;

      case 'close_webview':
        this.webViewManager.closeWebView();
        break;

      default:
        console.warn('Unhandled request type:', actualData.data.type);
    }
  };

  private async handleSendOtp(
    contact: string,
    provider: 'email' | 'whatsapp',
    baseResponse: { id: string; method: string },
  ) {
    try {
      if (!this.oktoClient) {
        throw new Error('OktoClient is not initialized');
      }
      const response = await this.oktoClient.sendOTP(contact, provider);
      var payload =
        provider == 'email'
          ? { provider: provider, email: contact, token: response?.token }
          : {
              provider: provider,
              whatsapp_number: contact,
              token: response?.token,
            };
      if (response?.token) {
        this.webViewManager.sendResponse(
          baseResponse.id,
          baseResponse.method,
          payload,
          null,
        );
      } else {
        console.warn('Token not found in response:', response);
        this.webViewManager.sendResponse(
          baseResponse.id,
          baseResponse.method,
          {
            message: 'Failed to send OTP: Token missing in response',
          },
          null,
        );
      }
    } catch (error) {
      console.error('Error while sending OTP:', error);
      this.webViewManager.sendResponse(baseResponse.id, baseResponse.method, {
        message: 'Failed to send OTP',
        error,
      });
    }
  }

  private async handleVerifyOtp(
    contact: string,
    otp: string,
    provider: 'email' | 'whatsapp',
    token: string,
    baseResponse: { id: string; method: string },
  ) {
    try {
      if (!this.oktoClient) {
        throw new Error('OktoClient is not initialized');
      }

      const loginMethod =
        provider === 'email'
          ? this.oktoClient.loginUsingEmail
          : this.oktoClient.loginUsingWhatsApp;

      const response = await loginMethod.call(
        this.oktoClient,
        contact,
        otp,
        token,
      );

      if (response) {
        const payload =
          provider === 'email'
            ? { provider, email: contact, token, message: 'Login successful' }
            : {
                provider,
                whatsapp_number: contact,
                token,
                message: 'Login successful',
              };

        this.webViewManager.sendResponse(
          baseResponse.id,
          baseResponse.method,
          payload,
          null,
        );

        setTimeout(() => {
          this.webViewManager.closeWebView();
        }, 2000);

        console.log('Login successful:', response);
      } else {
        throw new Error(response || 'Login failed');
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);

      this.webViewManager.sendResponse(
        baseResponse.id,
        baseResponse.method,
        {
          provider,
          contact,
          message: 'Failed to verify OTP',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        null,
      );
    }
  }
}
