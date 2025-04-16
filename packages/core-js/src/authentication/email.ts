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
    // Create an empty object and build it with properties in the exact order needed
    const data: any = {};

    // These two fields always come first
    data.email = email;

    // For verifyOTP: add token then otp
    // For resendOTP: add only token
    // For sendOTP: don't add token or otp
    if (token) {
      data.token = token;
    }

    if (otp) {
      data.otp = otp;
    }

    // These fields always come last, in this order
    data.client_swa = oc.clientSWA;
    data.timestamp = Date.now();

    const message = JSON.stringify(data);
    const clientSignature = await viemSignMessage({
      message,
      privateKey: this.clientPrivateKey,
    });

    // Return the payload with the signed message
    return {
      data,
      client_signature: clientSignature,
      type: 'ethsign',
    } as any;
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
