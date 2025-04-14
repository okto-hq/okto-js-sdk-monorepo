import type OktoClient from '@/core/index.js';
import { getAuthClient } from './client.js';
import type { ApiResponse } from '@/types/api.js';
import type {
  WhatsAppResendOtpRequest,
  WhatsAppResendOtpResponse,
  WhatsAppSendOtpRequest,
  WhatsAppSendOtpResponse,
  WhatsAppVerifyOtpRequest,
  WhatsAppVerifyOtpResponse,
} from '@/types/auth/whatsapp.js';
import type {
  EmailResendOtpRequest,
  EmailResendOtpResponse,
  EmailSendOtpRequest,
  EmailSendOtpResponse,
  EmailVerifyOtpRequest,
  EmailVerifyOtpResponse,
} from '@/types/auth/email.js';

class AuthClientRepository {
  private static routes = {
    sendWhatsAppOTP: '/api/oc/v1/authenticate/whatsapp',
    verifyWhatsAppOTP: '/api/oc/v1/authenticate/whatsapp/verify_otp',
    sendEmailOTP: '/api/oc/v1/authenticate/email',
    verifyEmailOTP: '/api/oc/v1/authenticate/email/verify_otp',
  };

  public static async sendWhatsAppOTP(
    oc: OktoClient,
    payload: WhatsAppSendOtpRequest,
  ): Promise<WhatsAppSendOtpResponse> {
    const response = await getAuthClient(oc).post<
      ApiResponse<WhatsAppSendOtpResponse>
    >(this.routes.sendWhatsAppOTP, payload);

    if (response.data.status === 'error') {
      throw new Error('Failed to send WhatsApp OTP');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  public static async verifyWhatsAppOTP(
    oc: OktoClient,
    payload: WhatsAppVerifyOtpRequest,
  ): Promise<WhatsAppVerifyOtpResponse> {
    const response = await getAuthClient(oc).post<
      ApiResponse<WhatsAppVerifyOtpResponse>
    >(this.routes.verifyWhatsAppOTP, payload);

    if (response.data.status === 'error') {
      throw new Error('Failed to verify WhatsApp OTP');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  public static async resendWhatsAppOTP(
    oc: OktoClient,
    payload: WhatsAppResendOtpRequest,
  ): Promise<WhatsAppResendOtpResponse> {
    const response = await getAuthClient(oc).post<
      ApiResponse<WhatsAppResendOtpResponse>
    >(this.routes.sendWhatsAppOTP, payload);

    if (response.data.status === 'error') {
      throw new Error('Failed to resend WhatsApp OTP');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }
    return response.data.data;
  }

  public static async sendEmailOTP(
    oc: OktoClient,
    payload: EmailSendOtpRequest,
  ): Promise<EmailSendOtpResponse> {
    const response = await getAuthClient(oc).post<
      ApiResponse<EmailSendOtpResponse>
    >(this.routes.sendEmailOTP, payload);

    if (response.data.status === 'error') {
      throw new Error('Failed to send Email OTP');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  public static async verifyEmailOTP(
    oc: OktoClient,
    payload: EmailVerifyOtpRequest,
  ): Promise<EmailVerifyOtpResponse> {
    const response = await getAuthClient(oc).post<
      ApiResponse<EmailVerifyOtpResponse>
    >(this.routes.verifyEmailOTP, payload);

    if (response.data.status === 'error') {
      throw new Error('Failed to verify Email OTP');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }

  public static async resendEmailOTP(
    oc: OktoClient,
    payload: EmailResendOtpRequest,
  ): Promise<EmailResendOtpResponse> {
    const response = await getAuthClient(oc).post<
      ApiResponse<EmailResendOtpResponse>
    >(this.routes.sendEmailOTP, payload);

    if (response.data.status === 'error') {
      throw new Error('Failed to resend Email OTP');
    }

    if (!response.data.data) {
      throw new Error('Response data is missing');
    }

    return response.data.data;
  }
}

export default AuthClientRepository;
