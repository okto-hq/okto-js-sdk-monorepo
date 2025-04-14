import type OktoClient from '@/core/index.js';
import AuthClientRepository from '@/api/auth.js';
import type {
  WhatsAppSendOtpRequest,
  WhatsAppSendOtpResponse,
  WhatsAppVerifyOtpRequest,
  WhatsAppVerifyOtpResponse,
  WhatsAppResendOtpRequest,
  WhatsAppResendOtpResponse,
} from '@/types/auth/whatsapp.js';
import { v4 as uuidv4 } from 'uuid';
import { signMessage as viemSignMessage } from 'viem/accounts';
import { fromHex } from 'viem';

class WhatsAppAuthentication {
  /**
   * Private method to generate the base request payload for WhatsApp authentication.
   *
   * @param {OktoClient} oc - The OktoClient instance
   * @param {string} whatsappNumber - The WhatsApp number of the user
   * @param {string} countryShortName - The short name of the country (e.g., 'IN')
   * @param {string} [token] - The token received from previous OTP request (optional)
   * @param {string} [otp] - The OTP received by the user (optional)
   * @returns {Promise<WhatsAppSendOtpRequest | WhatsAppResendOtpRequest | WhatsAppVerifyOtpRequest>} The generated request payload
   */
  private static async _generateBasePayload(
    oc: OktoClient,
    whatsappNumber: string,
    countryShortName: string,
    token?: string,
    otp?: string,
  ): Promise<
    WhatsAppSendOtpRequest | WhatsAppResendOtpRequest | WhatsAppVerifyOtpRequest
  > {
    // Base request data that's common across all requests
    const baseData = {
      whatsapp_number: whatsappNumber,
      country_short_name: countryShortName,
      client_swa: oc.clientSWA,
      timestamp: Date.now(),
    };

    // Create the appropriate payload based on the parameters provided
    let data;
    if (token && otp) {
      // For verify OTP
      data = { ...baseData, token, otp };
    } else if (token) {
      // For resend OTP
      data = { ...baseData, token };
    } else {
      // For send OTP
      data = baseData;
    }

    const message = JSON.stringify(data);

    // const clientPrivateKey = oc.clientSWA;
    const clientSignature = await viemSignMessage({
      message: message, // Convert message to bytes if needed
      privateKey: '0x', // check on how to fetch client private key
    });

    // Return the complete payload
    return {
      data,
      client_signature: clientSignature,
      type: 'ethsign',
    } as any;
  }

  /**
   * Sends a WhatsApp OTP to the specified number.
   *
   * @param {OktoClient} oc - The OktoClient instance
   * @param {string} whatsappNumber - The WhatsApp number to send the OTP to
   * @param {string} countryShortName - The short name of the country (e.g., 'IN')
   * @returns {Promise<WhatsAppSendOtpResponse>} The response from the server
   */
  public static async sendOTP(
    oc: OktoClient,
    whatsappNumber: string,
    countryShortName: string,
  ): Promise<WhatsAppSendOtpResponse> {
    try {
      const payload = (await this._generateBasePayload(
        oc,
        whatsappNumber,
        countryShortName,
      )) as WhatsAppSendOtpRequest;

      return await AuthClientRepository.sendWhatsAppOTP(oc, payload);
    } catch (error) {
      console.error('Error sending WhatsApp OTP:', error);
      throw error;
    }
  }

  /**
   * Verifies the WhatsApp OTP provided by the user.
   *
   * @param {OktoClient} oc - The OktoClient instance
   * @param {string} whatsappNumber - The WhatsApp number
   * @param {string} countryShortName - The short name of the country (e.g., 'IN')
   * @param {string} token - The token received from the send OTP request
   * @param {string} otp - The OTP received by the user
   * @returns {Promise<WhatsAppVerifyOtpResponse>} The response from the server
   */
  public static async verifyOTP(
    oc: OktoClient,
    whatsappNumber: string,
    countryShortName: string,
    token: string,
    otp: string,
  ): Promise<WhatsAppVerifyOtpResponse> {
    try {
      const payload = (await this._generateBasePayload(
        oc,
        whatsappNumber,
        countryShortName,
        token,
        otp,
      )) as WhatsAppVerifyOtpRequest;

      return await AuthClientRepository.verifyWhatsAppOTP(oc, payload);
    } catch (error) {
      console.error('Error verifying WhatsApp OTP:', error);
      throw error;
    }
  }

  /**
   * Resends a WhatsApp OTP using the token from a previous request.
   *
   * @param {OktoClient} oc - The OktoClient instance
   * @param {string} whatsappNumber - The WhatsApp number
   * @param {string} countryShortName - The short name of the country (e.g., 'IN')
   * @param {string} token - The token received from the previous send OTP request
   * @returns {Promise<WhatsAppResendOtpResponse>} The response from the server
   */
  public static async resendOTP(
    oc: OktoClient,
    whatsappNumber: string,
    countryShortName: string,
    token: string,
  ): Promise<WhatsAppResendOtpResponse> {
    try {
      const payload = (await this._generateBasePayload(
        oc,
        whatsappNumber,
        countryShortName,
        token,
      )) as WhatsAppResendOtpRequest;

      return await AuthClientRepository.resendWhatsAppOTP(oc, payload);
    } catch (error) {
      console.error('Error resending WhatsApp OTP:', error);
      throw error;
    }
  }
}

export default WhatsAppAuthentication;
