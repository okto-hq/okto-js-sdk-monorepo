import type { WebViewManager } from '../webViewManager.js';
import type { WebViewRequestHandler, WhatsAppOtpResponse } from '../types.js';

/**
 * @description
 * Handles requests from the WebView and sends appropriate responses.
 * This class is responsible for managing the communication between the WebView and the main application.
 * It processes different types of requests such as OTP requests, OTP verification, and WebView closure.
 * It also manages the WebView lifecycle.
 */
export class AuthRequestHandler {
  private webViewManager: WebViewManager;
  private requestOtp?: () => WhatsAppOtpResponse;
  private verifyOtp?: () => WhatsAppOtpResponse;
  private resendOtp?: () => WhatsAppOtpResponse;

  constructor(
    webViewManager: WebViewManager,
    requestOtp?: () => WhatsAppOtpResponse,
    verifyOtp?: () => WhatsAppOtpResponse,
    resendOtp?: () => WhatsAppOtpResponse,
  ) {
    this.requestOtp = requestOtp;
    this.verifyOtp = verifyOtp;
    this.resendOtp = resendOtp;
    this.webViewManager = webViewManager;
  }

  public handleRequest: WebViewRequestHandler = (actualData: any) => {
    if (!actualData?.data?.type) return;

    const baseResponse = {
      id: actualData.id || 'uuid-for-webview',
      method: actualData.method || 'okto_sdk_login',
    };

    switch (actualData.data.type) {
      case 'request_otp':
        this.webViewManager.sendResponse(
          baseResponse.id,
          baseResponse.method,
          {
            provider: actualData.data.provider,
            whatsapp_number: actualData.data.whatsapp_number,
            token: 'bsdbcgsdjhgfjhsd',
          },
          null,
        );
        break;

      case 'verify_otp':
        console.log('Verifying OTP:', actualData.data.otp);
        this.webViewManager.sendResponse(
          baseResponse.id,
          baseResponse.method,
          {
            provider: actualData.data.provider,
            whatsapp_number: actualData.data.whatsapp_number,
            otp: actualData.data.otp,
            token: 'bsdbcgsdjhgfjhsd',
            message: 'Detailed status message',
          },
          null,
        );
        setTimeout(() => {
          this.webViewManager.closeWebView();
        }, 1000);
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
}
