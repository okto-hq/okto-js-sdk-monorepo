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

  public handleRequest: WebViewRequestHandler = async (actualData: {
    data?: { [key: string]: unknown } | undefined;
  }) => {
    console.log('Received request:', actualData);
    // if (!actualData?.data?.type) return;

    if (typeof actualData !== 'object' || actualData === null) {
      throw new Error('Invalid request data');
    }

    const baseResponse = {
      id: (actualData as { id?: string }).id || 'uuid-for-webview',
      method: (actualData as { method?: string }).method || 'okto_sdk_login',
    };

    if (
      (actualData as { data?: { provider?: string } }).data?.provider ===
      'google'
    ) {
      console.log('Google login initiated');
      const response = await this.oktoClient?.loginUsingSocial('google');
      console.log('Google login response:', response);
      if (response) {
        this.webViewManager.sendResponse(baseResponse.id, baseResponse.method, {
          success: true,
          message: 'Google login successful',
          token: response,
        });
        this.webViewManager.closeWebView();
        return response;
      } else {
        this.webViewManager.sendErrorResponse(
          baseResponse.id,
          baseResponse.method,
          (actualData as { data?: { [key: string]: unknown } }).data,
          `error occurred while logging in with google: ${response}`,
        );
        throw new Error(
          `error occurred while logging in with google: ${response}`,
        );
      }
    }

    switch (actualData.data?.type) {
      case 'request_otp':
        this.handleSendOtp(
          actualData.data.provider == 'email'
            ? (actualData.data.email as string)
            : (actualData.data.whatsapp_number as string),
          actualData.data.provider as 'email' | 'whatsapp',
          baseResponse,
          actualData.data,
        );
        break;

      case 'verify_otp': {
        console.log('Verifying OTP:', actualData.data.otp);
        const response = await this.handleVerifyOtp(
          actualData.data.provider == 'email'
            ? (actualData.data.email as string)
            : (actualData.data.whatsapp_number as string),
          actualData.data.otp as string,
          actualData.data.provider as 'email' | 'whatsapp',
          actualData.data.token as string,
          baseResponse,
          actualData.data,
        );
        console.log('OTP verification response Srijan:', response);
        return response;
      }

      case 'resend_otp':
        this.handleResendOtp(
          actualData.data.provider == 'email'
            ? (actualData.data.email as string)
            : (actualData.data.whatsapp_number as string),
          actualData.data.provider as 'email' | 'whatsapp',
          actualData.data.token as string,
          baseResponse,
          actualData.data,
        );
        break;
      case 'paste_otp':
        this.handlePasteOtp(
          actualData.data.provider as 'email' | 'whatsapp',
          actualData.data.otp as string,
          baseResponse,
          actualData.data,
        );
        break;
      case 'close_webview':
        this.webViewManager.closeWebView();
        break;

      default:
        console.warn(
          'Unhandled request type:',
          actualData.data?.type ?? 'undefined',
        );
    }
  };

  private async handleSendOtp(
    contact: string,
    provider: 'email' | 'whatsapp',
    baseResponse: { id: string; method: string },
    data: unknown,
  ) {
    try {
      if (!this.oktoClient) {
        throw new Error('OktoClient is not initialized');
      }
      const response = await this.oktoClient.sendOTP(contact, provider);
      const payload =
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
        );
      } else {
        console.warn('Token not found in response:', response);
        this.webViewManager.sendErrorResponse(
          baseResponse.id,
          baseResponse.method,
          data,
          'Failed to send OTP: Token missing in response',
        );
      }
    } catch (error) {
      console.error('Error while sending OTP:', error);
      this.webViewManager.sendErrorResponse(
        baseResponse.id,
        baseResponse.method,
        data,
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
    data: unknown,
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
        data,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  private async handleResendOtp(
    contact: string,
    provider: 'email' | 'whatsapp',
    token: string,
    baseResponse: { id: string; method: string },
    data: unknown,
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
        );
      } else {
        console.warn('Token not found in response:', response);
        this.webViewManager.sendErrorResponse(
          baseResponse.id,
          baseResponse.method,
          data,
          'Failed to resend OTP: Token missing in response',
        );
      }
    } catch (error) {
      console.error('Error while resending OTP:', error);

      this.webViewManager.sendErrorResponse(
        baseResponse.id,
        baseResponse.method,
        data,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  private async handlePasteOtp(
    provider: 'email' | 'whatsapp',
    otp: string,
    baseResponse: { id: string; method: string },
    data: unknown,
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
      );
    } catch (error) {
      console.error('Error while fetching OTP from clipboard:', error);

      this.webViewManager.sendErrorResponse(
        baseResponse.id,
        baseResponse.method,
        data,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
