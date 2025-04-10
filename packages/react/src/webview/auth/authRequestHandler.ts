import type { WebViewRequestHandler } from '../types.js';
import type { WebViewManager } from '../webViewManager.js';

export const createAuthRequestHandler = (
  webViewManager: WebViewManager,
): WebViewRequestHandler => {
  return (actualData: any) => {
    if (!actualData?.data?.type) return;

    const baseResponse = {
      id: actualData.id || 'uuid-for-webview',
      method: actualData.method || 'okto_sdk_login',
    };

    switch (actualData.data.type) {
      case 'request_otp':
        webViewManager.sendResponse(
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
        webViewManager.sendResponse(
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
          webViewManager.closeWebView();
        }, 2000);
        break;

      case 'resend_otp':
        webViewManager.sendResponse(
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
        webViewManager.closeWebView();
        break;

      default:
        console.warn('Unhandled request type:', actualData.data.type);
    }
  };
};
