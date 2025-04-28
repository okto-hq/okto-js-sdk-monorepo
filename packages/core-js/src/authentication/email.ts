import type OktoClient from '@/core/index.js';
import AuthClientRepository from '@/api/auth.js';
import type {
  EmailSendOtpRequest,
  EmailSendOtpResponse,
  EmailVerifyOtpRequest,
  EmailVerifyOtpResponse,
  EmailResendOtpRequest,
  EmailResendOtpResponse,
} from '@/types/auth/email.js';
import { signMessage as viemSignMessage } from 'viem/accounts';
import type { Hash } from '@/types/core.js';

// Define base interface for email data
interface EmailOtpBaseData {
  email: string;
  client_swa: string;
  timestamp: number;
}

// Interface for email data with token
interface EmailOtpTokenData extends EmailOtpBaseData {
  token: string;
}

// Interface for email data with token and OTP
interface EmailOtpVerifyData extends EmailOtpTokenData {
  otp: string;
}

class EmailAuthentication {
  private readonly clientPrivateKey: Hash;

  constructor(clientPrivateKey: Hash) {
    this.clientPrivateKey = clientPrivateKey;
  }

  /**
   * Private method to generate the base request payload for Email authentication.
   *
   * @param {OktoClient} oc - The OktoClient instance
   * @param {string} email - The email address of the user
   * @param {string} [token] - The token received from previous OTP request (optional)
   * @param {string} [otp] - The OTP received by the user (optional)
   * @returns {Promise<EmailSendOtpRequest | EmailResendOtpRequest | EmailVerifyOtpRequest>} The generated request payload
   */
  private async _generateBasePayload(
    oc: OktoClient,
    email: string,
    token?: string,
    otp?: string,
  ): Promise<
    EmailSendOtpRequest | EmailResendOtpRequest | EmailVerifyOtpRequest
  > {
    // Create data object based on parameters
    let data: EmailOtpBaseData | EmailOtpTokenData | EmailOtpVerifyData = {
      email,
      client_swa: oc.clientSWA || '', // Ensure client_swa is always a string
      timestamp: Date.now(),
    };

    /**
     * Token and OTP handling logic:
     * - For verifyOTP: Requires both token and OTP
     * - For resendOTP: Requires only token
     * - For sendOTP: Neither token nor OTP required
     */
    if (token) {
      data = { ...data, token };
    }

    if (otp && token) {
      data = { ...data, token, otp };
    }

    const message = JSON.stringify(data);
    const clientSignature = await viemSignMessage({
      message,
      privateKey: this.clientPrivateKey,
    });

    // Create the appropriate request object based on parameters
    if (otp && token) {
      // It's a verify request
      return {
        data,
        client_signature: clientSignature,
        type: 'ethsign',
      } as unknown as EmailVerifyOtpRequest;
    } else if (token) {
      // It's a resend request
      return {
        data,
        client_signature: clientSignature,
        type: 'ethsign',
      } as unknown as EmailResendOtpRequest;
    } else {
      // It's a send request
      return {
        data,
        client_signature: clientSignature,
        type: 'ethsign',
      } as unknown as EmailSendOtpRequest;
    }
  }

  /**
   * Sends an Email OTP to the specified email address.
   *
   * @param {OktoClient} oc - The OktoClient instance
   * @param {string} email - The email address to send the OTP to
   * @returns {Promise<EmailSendOtpResponse>} The response from the server
   */
  public async sendOTP(
    oc: OktoClient,
    email: string,
  ): Promise<EmailSendOtpResponse> {
    try {
      const payload = (await this._generateBasePayload(
        oc,
        email,
      )) as EmailSendOtpRequest;

      return await AuthClientRepository.sendEmailOTP(oc, payload);
    } catch (error) {
      console.error('Error sending Email OTP:', error);
      throw error;
    }
  }

  /**
   * Verifies the Email OTP provided by the user.
   *
   * @param {OktoClient} oc - The OktoClient instance
   * @param {string} email - The email address
   * @param {string} token - The token received from the send OTP request
   * @param {string} otp - The OTP received by the user
   * @returns {Promise<EmailVerifyOtpResponse>} The response from the server
   */
  public async verifyOTP(
    oc: OktoClient,
    email: string,
    token: string,
    otp: string,
  ): Promise<EmailVerifyOtpResponse> {
    try {
      const payload = (await this._generateBasePayload(
        oc,
        email,
        token,
        otp,
      )) as EmailVerifyOtpRequest;

      return await AuthClientRepository.verifyEmailOTP(oc, payload);
    } catch (error) {
      console.error('Error verifying Email OTP:', error);
      throw error;
    }
  }

  /**
   * Resends an Email OTP using the token from a previous request.
   *
   * @param {OktoClient} oc - The OktoClient instance
   * @param {string} email - The email address
   * @param {string} token - The token received from the previous send OTP request
   * @returns {Promise<EmailResendOtpResponse>} The response from the server
   */
  public async resendOTP(
    oc: OktoClient,
    email: string,
    token: string,
  ): Promise<EmailResendOtpResponse> {
    try {
      const payload = (await this._generateBasePayload(
        oc,
        email,
        token,
      )) as EmailResendOtpRequest;

      return await AuthClientRepository.resendEmailOTP(oc, payload);
    } catch (error) {
      console.error('Error resending Email OTP:', error);
      throw error;
    }
  }
}

export default EmailAuthentication;
