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

  public handleRequest: WebViewRequestHandler = async (actualData: any) => {
    console.log('Received request:', actualData);
    // if (!actualData?.data?.type) return;

    const baseResponse = {
      id: actualData.id || 'uuid-for-webview',
      method: actualData.method || 'okto_sdk_login',
    };

    if (actualData.data.provider === 'google') {
      console.log('Google login initiated');
      const response = await this.oktoClient?.loginUsingSocial('google');
      console.log('Google login response:', response);
      if (!response) {
        this.webViewManager.sendErrorResponse(
          baseResponse.id,
          baseResponse.method,
          `error occurred while logging in with google: ${response}`,
        );
        return;
      } else {
        this.webViewManager.sendResponse(
          baseResponse.id,
          baseResponse.method,
          {
            success: true,
            message: 'Google login successful',
            token: response,
          },
          null,
        );
        return;
      }
    }

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
        const response = await this.handleVerifyOtp(
          actualData.data.provider == 'email'
            ? actualData.data.email
            : actualData.data.whatsapp_number,
          actualData.data.otp,
          actualData.data.provider,
          actualData.data.token,
          baseResponse,
        );
        console.log('OTP verification response Srijan:', response);
        return response;

      case 'resend_otp':
        this.handleResendOtp(
          actualData.data.provider == 'email'
            ? actualData.data.email
            : actualData.data.whatsapp_number,
          actualData.data.provider,
          actualData.data.token,
          baseResponse,
        );
        break;
      case 'paste_otp':
        this.handlePasteOtp(
          actualData.data.provider,
          actualData.data.otp,
          baseResponse,
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
        this.webViewManager.sendErrorResponse(
          baseResponse.id,
          baseResponse.method,
          'Failed to send OTP: Token missing in response',
        );
      }
    } catch (error) {
      console.error('Error while sending OTP:', error);
      this.webViewManager.sendErrorResponse(
        baseResponse.id,
        baseResponse.method,
        error as string,
      );
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
        }, 1000);

        console.log('Login successful:', response);
        return response;
      } else {
        throw new Error(response || 'Login failed');
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);

      this.webViewManager.sendErrorResponse(
        baseResponse.id,
        baseResponse.method,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  private async handleResendOtp(
    contact: string,
    provider: 'email' | 'whatsapp',
    token: string,
    baseResponse: { id: string; method: string },
  ) {
    try {
      if (!this.oktoClient) {
        throw new Error('OktoClient is not initialized');
      }

      const response = await this.oktoClient.resendOTP(
        contact,
        token,
        provider,
      );

      const payload =
        provider === 'email'
          ? { provider, email: contact, token: response?.token }
          : {
              provider,
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
        this.webViewManager.sendErrorResponse(
          baseResponse.id,
          baseResponse.method,
          'Failed to resend OTP: Token missing in response',
        );
      }
    } catch (error) {
      console.error('Error while resending OTP:', error);

      this.webViewManager.sendErrorResponse(
        baseResponse.id,
        baseResponse.method,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  private async handlePasteOtp(
    provider: 'email' | 'whatsapp',
    otp: string,
    baseResponse: { id: string; method: string },
  ) {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        throw new Error('No OTP found on clipboard');
      }

      const payload = {
        provider: provider,
        type: 'paste_otp',
        message: clipboardText,
      };

      this.webViewManager.sendResponse(
        baseResponse.id,
        baseResponse.method,
        payload,
        null,
      );
    } catch (error) {
      console.error('Error while fetching OTP from clipboard:', error);

      this.webViewManager.sendErrorResponse(
        baseResponse.id,
        baseResponse.method,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
