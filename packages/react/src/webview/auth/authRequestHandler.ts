import type { WebViewManager } from '../webViewManager.js';
import type { AppearanceOptions, WebViewRequestHandler } from '../types.js';
import type { OktoClient } from 'src/core/index.js';

type OtpProvider = 'email' | 'whatsapp';
type SocialProvider = 'google' | 'apple';

/**
 * @description
 * Handles requests from the WebView and sends appropriate responses.
 * This class is responsible for managing the communication between the WebView and the main application.
 * It processes different types of requests such as OTP requests, OTP verification, and WebView closure.
 * It also manages the WebView lifecycle.
 */
export class AuthRequestHandler {
  constructor(
    private webViewManager: WebViewManager,
    private oktoClient?: OktoClient,
  ) {}

  public handleRequest: WebViewRequestHandler = async (
    actualData,
    style?: AppearanceOptions,
  ) => {
    try {
      const data = actualData?.data;
      const id = (actualData as { id?: string })?.id || 'uuid-for-webview';
      const method =
        (actualData as { method?: string })?.method || 'okto_sdk_login';

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid request data');
      }

      const baseResponse = { id, method };

      if (data.type === 'ui_config') {
        return this.sendResponse(baseResponse, {
          type: 'ui_config',
          config: { ...style },
        });
      }

      const handlerMap: Record<string, () => Promise<unknown> | void> = {
        request_otp: () => this.handleOtp('send', data, baseResponse),
        verify_otp: () => this.handleOtp('verify', data, baseResponse),
        resend_otp: () => this.handleOtp('resend', data, baseResponse),
        paste_otp: () => this.handlePasteOtp(data, baseResponse),
        close_webview: () => this.webViewManager.closeWebView(),
      };

      if (data.provider === 'google' || data.provider === 'apple') {
        return this.handleSocialLogin(data.provider, baseResponse, data);
      }

      const type = data.type as keyof typeof handlerMap;
      const handler = handlerMap[type];
      if (handler) {
        return await handler();
      }

      console.warn(`Unhandled request type: ${data.type}`);
    } catch (error) {
      console.error('Unexpected error in handleRequest:', error);
    }
  };

  private async handleOtp(
    action: 'send' | 'verify' | 'resend',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    baseResponse: { id: string; method: string },
  ) {
    if (!this.oktoClient) {
      throw new Error('OktoClient is not initialized');
    }

    const provider: OtpProvider = data.provider;
    const contact = provider === 'email' ? data.email : data.whatsapp_number;

    try {
      let response;
      switch (action) {
        case 'send': {
          response = await this.oktoClient.sendOTP(contact, provider);
          break;
        }
        case 'verify': {
          const loginMethod =
            provider === 'email'
              ? this.oktoClient.loginUsingEmail
              : this.oktoClient.loginUsingWhatsApp;
          response = await loginMethod.call(
            this.oktoClient,
            contact,
            data.otp,
            data.token,
          );
          break;
        }
        case 'resend': {
          response = await this.oktoClient.resendOTP(
            contact,
            data.token,
            provider,
          );
          break;
        }
      }

      const token =
        typeof response === 'object' && 'token' in response
          ? response.token
          : response || data.token;
      if (!token) {
        throw new Error(`Token missing in response from ${action} OTP`);
      }

      const payload = {
        provider,
        ...(provider === 'email'
          ? { email: contact }
          : { whatsapp_number: contact }),
        token,
        ...(action === 'verify' && { message: 'Login successful' }),
      };

      this.sendResponse(baseResponse, payload);

      if (action === 'verify') {
        this.webViewManager.triggerSuccess(String(response));
        setTimeout(
          () => this.webViewManager.closeWebView({ triggerCallback: false }),
          1000,
        );
        return response;
      }
    } catch (error) {
      this.sendError(baseResponse, data, error, `OTP ${action} failed`);
    }
  }

  private async handlePasteOtp(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    baseResponse: { id: string; method: string },
  ) {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) throw new Error('No OTP found on clipboard');

      const payload = {
        provider: data.provider,
        type: 'paste_otp',
        message: clipboardText,
      };

      this.sendResponse(baseResponse, payload);
    } catch (error) {
      this.sendError(baseResponse, data, error, 'Paste OTP failed');
    }
  }

  private async handleSocialLogin(
    provider: SocialProvider,
    baseResponse: { id: string; method: string },
    data?: { [key: string]: unknown },
  ) {
    try {
      const response = await this.oktoClient?.loginUsingSocial(provider);
      if (!response) throw new Error(`${provider} login failed`);

      this.sendResponse(baseResponse, {
        success: true,
        message: `${provider} login successful`,
        token: response,
      });

      this.webViewManager.triggerSuccess(String(response));
      setTimeout(
        () => this.webViewManager.closeWebView({ triggerCallback: false }),
        1000,
      );
      return response;
    } catch (error) {
      this.sendError(baseResponse, data, error, `${provider} login failed`);
      setTimeout(() => this.webViewManager.closeWebView(), 1000);
    }
  }

  private sendResponse(
    base: { id: string; method: string },
    payload: Record<string, unknown>,
  ) {
    this.webViewManager.sendResponse(base.id, base.method, payload);
  }

  private sendError(
    base: { id: string; method: string },
    data: unknown,
    error: unknown,
    fallbackMessage = 'Unknown error',
  ) {
    const message = error instanceof Error ? error.message : fallbackMessage;
    console.error('Handler error:', message);
    this.webViewManager.sendErrorResponse(base.id, base.method, data, message);
    this.webViewManager?.triggerError?.(
      error instanceof Error ? error : new Error(message),
    );
  }
}
