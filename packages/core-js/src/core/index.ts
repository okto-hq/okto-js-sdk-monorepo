import BffClientRepository from '@/api/bff.js';
import { RpcError } from '@/errors/rpc.js';
import type { Address, Hash, Hex, UserOp } from '@/types/core.js';
import type { GetUserKeysResult } from '@/types/gateway/signMessage.js';
import type { AuthData, SocialAuthType } from '@/types/index.js';
import { getPublicKey, SessionKey } from '@/utils/sessionKey.js';
import { generatePackedUserOp, generateUserOpHash } from '@/utils/userop.js';
import { BaseError, fromHex } from 'viem';
import { signMessage as viemSignMessage } from 'viem/accounts';
import {
  productionEnvConfig,
  sandboxEnvConfig,
  stagingEnvConfig,
} from './config.js';
import { generateAuthenticatePayload } from './login.js';
import {
  validateAuthData,
  validateContact,
  validateEmail,
  validateOktoClientConfig,
  validatePhoneNumber,
  validateUserOp,
} from './oktoClientInputValidator.js';
import { generatePaymasterData } from './paymaster.js';
import { generateSignMessagePayload } from './signMessage.js';
import type { ClientConfig, Env, EnvConfig, SessionConfig } from './types.js';
import WhatsAppAuthentication from '@/authentication/whatsapp.js';
import EmailAuthentication from '@/authentication/email.js';
import type {
  EmailResendOtpResponse,
  EmailSendOtpResponse,
} from '@/types/auth/email.js';
import type {
  WhatsAppResendOtpResponse,
  WhatsAppSendOtpResponse,
} from '@/types/auth/whatsapp.js';
import SocialAuthUrlGenerator from '@/authentication/social.js';

export interface OktoClientConfig {
  environment: Env;
  clientPrivateKey: Hash;
  clientSWA: Hex;
}

class OktoClient {
  private _environment: Env;
  private _clientConfig: ClientConfig;
  private _sessionConfig: SessionConfig | undefined;
  private _userKeys: GetUserKeysResult | undefined;
  readonly isDev: boolean = true; //* Mark it as true for development environment
  private _whatsAppAuthentication: WhatsAppAuthentication;
  private _emailAuthentication: EmailAuthentication;
  private _socialAuthUrlGenerator: SocialAuthUrlGenerator;

  constructor(config: OktoClientConfig) {
    validateOktoClientConfig(config);

    this._clientConfig = {
      clientPrivKey: config.clientPrivateKey,
      clientPubKey: getPublicKey(config.clientPrivateKey),
      clientSWA: config.clientSWA,
    };
    this._environment = config.environment;
    this._whatsAppAuthentication = new WhatsAppAuthentication(
      config.clientPrivateKey,
    );
    this._emailAuthentication = new EmailAuthentication(
      config.clientPrivateKey,
    );
    this._socialAuthUrlGenerator = new SocialAuthUrlGenerator();
  }

  get env(): EnvConfig {
    switch (this._environment) {
      case 'staging':
        return stagingEnvConfig;
      case 'sandbox':
        return sandboxEnvConfig;
      case 'production':
        return productionEnvConfig;
      default:
        return productionEnvConfig;
    }
  }

  protected setSessionConfig(sessionConfig: SessionConfig): void {
    this._sessionConfig = sessionConfig;
  }

  /**
   * Sends an OTP to the specified contact (email or phone number).
   *
   * @param {string} contact - The email address or phone number with country code
   * @param {'email' | 'whatsapp'} method - The method to send OTP (email or whatsapp)
   * @returns {Promise<EmailSendOtpResponse | WhatsAppSendOtpResponse>} - The response from the server
   */
  public async sendOTP(
    contact: string,
    method: 'email' | 'whatsapp',
  ): Promise<EmailSendOtpResponse | WhatsAppSendOtpResponse> {
    try {
      const validatedContact = validateContact(contact, method);

      if (validatedContact === null) {
        throw new BaseError('Invalid contact information or method');
      }

      if (method === 'email') {
        return this._emailAuthentication.sendOTP(this, contact);
      } else if (method === 'whatsapp') {
        return this._whatsAppAuthentication.sendOTP(this, contact, 'IN');
      } else {
        throw new Error('Invalid OTP method specified');
      }
    } catch (error) {
      console.error(`Error sending OTP via ${method}:`, error);
      throw error;
    }
  }

  /**
   * Resends an OTP using the token from a previous request.
   *
   * @param {string} contact - The email address or phone number with country code
   * @param {string} token - The token received from the previous send OTP request
   * @param {'email' | 'whatsapp'} method - The method to resend OTP (email or whatsapp)
   * @returns {Promise<EmailResendOtpResponse | WhatsAppResendOtpResponse>} - The response from the server
   */
  public async resendOTP(
    contact: string,
    token: string,
    method: 'email' | 'whatsapp',
  ): Promise<EmailResendOtpResponse | WhatsAppResendOtpResponse> {
    try {
      const validatedContact = validateContact(contact, method);

      if (validatedContact === null) {
        throw new BaseError('Invalid contact information or method');
      }

      if (method === 'email') {
        return this._emailAuthentication.resendOTP(this, contact, token);
      } else if (method === 'whatsapp') {
        return this._whatsAppAuthentication.resendOTP(
          this,
          contact,
          'IN',
          token,
        );
      } else {
        throw new Error('Invalid OTP method specified');
      }
    } catch (error) {
      console.error(`Error resending OTP via ${method}:`, error);
      throw error;
    }
  }

  /**
   * Logs in a user using OAuth authentication.
   * @param data - Authentication data.
   * @param onSuccess - Callback function executed on successful login.
   * @param overrideSessionConfig - Optional session configuration to override the current session.
   * @returns {Promise<Address | RpcError | undefined>} A promise that resolves to the user's address, an RpcError, or undefined.
   */
  public async loginUsingOAuth(
    data: AuthData,
    onSuccess?: (session: SessionConfig) => void,
    overrideSessionConfig?: SessionConfig | undefined,
  ): Promise<Address | RpcError | undefined> {
    if (this.isLoggedIn()) {
      throw new BaseError('User is already logged in. Please log out first.');
    }
    validateAuthData(data);

    const clientPrivateKey = this._clientConfig.clientPrivKey;
    const clientSWA = this._clientConfig.clientSWA;
    const session = SessionKey.create();

    if (!clientPrivateKey || !clientSWA) {
      throw new Error('Client details not found');
    }

    const authPayload = await generateAuthenticatePayload(
      this,
      data,
      session,
      clientSWA,
      clientPrivateKey,
    );

    try {
      const authRes = await BffClientRepository.authenticate(
        this,
        authPayload,
      );

      // TODO: Update with SessionKey Object
      this._sessionConfig = {
        sessionPrivKey: session.privateKeyHexWith0x,
        sessionPubKey: session.uncompressedPublicKeyHexWith0x,
        userSWA: authRes.userSWA as Hex,
      };

      await this.syncUserKeys();
      onSuccess?.(this._sessionConfig);

      if (overrideSessionConfig) {
        this._sessionConfig = overrideSessionConfig;
      }

      return this.userSWA;
    } catch (error) {
      if (error instanceof RpcError) {
        return error;
      }
      throw error;
    }
  }

  /**
   * Logs in a user using Email authentication by first sending an OTP, verifying it,
   * and then using the auth token to complete the OAuth login flow.
   *
   * @param {string} email - The email address of the user
   * @param {string} otp - The OTP received by the user
   * @param {string} token - The token received from the sendOTP request
   * @param {Function} onSuccess - Callback function executed on successful login
   * @param {SessionConfig} overrideSessionConfig - Optional session configuration to override the current session
   * @returns {Promise<Address | RpcError | undefined>} - A promise that resolves to the user's address, an RpcError, or undefined
   */
  public async loginUsingEmail(
    email: string,
    otp: string,
    token: string,
    onSuccess?: (session: SessionConfig) => void,
    overrideSessionConfig?: SessionConfig | undefined,
  ): Promise<Address | RpcError | undefined> {
    if (this.isLoggedIn()) {
      throw new BaseError('User is already logged in. Please log out first.');
    }
    validateEmail(email);
    try {
      const verifyResponse = await this._emailAuthentication.verifyOTP(
        this,
        email,
        token,
        otp,
      );

      if (!verifyResponse.authToken) {
        throw new Error(
          'Authentication token not received from OTP verification',
        );
      }

      const authData: AuthData = {
        idToken: verifyResponse.authToken,
        provider: 'okto',
      };

      return this.loginUsingOAuth(authData, onSuccess, overrideSessionConfig);
    } catch (error) {
      console.error('Error logging in using email:', error);
      if (error instanceof RpcError) {
        return error;
      }
      throw error;
    }
  }

  /**
   * Logs in a user using WhatsApp authentication by first sending an OTP, verifying it,
   * and then using the auth token to complete the OAuth login flow.
   *
   * @param {string} phoneNumber - The phone number of the user with country code
   * @param {string} otp - The OTP received by the user
   * @param {string} token - The token received from the sendOTP request
   * @param {Function} onSuccess - Callback function executed on successful login
   * @param {SessionConfig} overrideSessionConfig - Optional session configuration to override the current session
   * @returns {Promise<Address | RpcError | undefined>} - A promise that resolves to the user's address, an RpcError, or undefined
   */
  public async loginUsingWhatsApp(
    phoneNumber: string,
    otp: string,
    token: string,
    onSuccess?: (session: SessionConfig) => void,
    overrideSessionConfig?: SessionConfig | undefined,
  ): Promise<Address | RpcError | undefined> {
    if (this.isLoggedIn()) {
      throw new BaseError('User is already logged in. Please log out first.');
    }
    validatePhoneNumber(phoneNumber);

    try {
      const verifyResponse = await this._whatsAppAuthentication.verifyOTP(
        this,
        phoneNumber,
        'IN',
        token,
        otp,
      );

      if (!verifyResponse.authToken) {
        throw new Error(
          'Authentication token not received from OTP verification',
        );
      }

      const authData: AuthData = {
        idToken: verifyResponse.authToken,
        provider: 'okto',
      };

      return this.loginUsingOAuth(authData, onSuccess, overrideSessionConfig);
    } catch (error) {
      console.error('Error logging in using WhatsApp:', error);
      if (error instanceof RpcError) {
        return error;
      }
      throw error;
    }
  }

  /**
   * Login using social authentication providers.
   * @param provider - The social authentication provider (e.g., 'google', 'facebook')
   * @param state - Additional state parameters for the auth URL
   * @param overrideOpenWindow - Function to override the default window opening behavior
   * @returns {Promise<Address | RpcError | undefined>} - Returns the user's address after successful login
   */
  public async loginUsingSocial(
    provider: SocialAuthType,
    state: Record<string, string>,
    overrideOpenWindow: (url: string) => Promise<string>,
    onSuccess?: (session: SessionConfig) => void,
    overrideSessionConfig?: SessionConfig | undefined,
  ): Promise<Address | RpcError | undefined> {
    if (this.isLoggedIn()) {
      throw new BaseError('User is already logged in. Please log out first.');
    }

    try {
      // Generate the authentication URL
      const url = this._socialAuthUrlGenerator.generateAuthUrl(
        provider,
        state,
        this.env,
      );

      // Get the ID token using the provided window override function
      const idToken = await overrideOpenWindow(url);
      if (!idToken) {
        throw new Error('No ID token received from authentication');
      }

      // Create auth data for OAuth login
      const authData: AuthData = {
        idToken,
        provider: provider,
      };

      // Perform OAuth login with the received token
      return await this.loginUsingOAuth(
        authData,
        onSuccess,
        overrideSessionConfig,
      );
    } catch (error) {
      console.error('Error during social authentication:', error);
      if (error instanceof RpcError) {
        return error;
      }
      throw error;
    }
  }

  /**
   * Logs in a user using JWT authentication.
   * @param jwtToken - The JWT token for authentication.
   * @param onSuccess - Callback function executed on successful login.
   * @param overrideSessionConfig - Optional session configuration to override the current session.
   * @returns {Promise<Address | RpcError | undefined>} - A promise that resolves to the user's address, an RpcError, or undefined.
   */
  public async loginUsingJWTAuthentication(
    jwtToken: string,
    onSuccess?: (session: SessionConfig) => void,
    overrideSessionConfig?: SessionConfig | undefined,
  ): Promise<Address | RpcError | undefined> {
    if (this.isLoggedIn()) {
      throw new BaseError('User is already logged in. Please log out first.');
    }

    const authData: AuthData = {
      idToken: jwtToken,
      provider: 'client_jwt',
    };

    return this.loginUsingOAuth(authData, onSuccess, overrideSessionConfig);
  }

  /**
   * Verifies if the user is logged in.
   * If user is not logged in, it clears the auth options.
   *
   * @returns {Promise<boolean>} A promise that resolves to a boolean value indicating if the user is logged in.
   */
  public async verifyLogin(): Promise<boolean> {
    try {
      const res = await BffClientRepository.verifySession(this);
      return (
        res?.clientSwa === this._clientConfig.clientSWA &&
        res?.userSwa === this._sessionConfig?.userSWA
      );
    } catch (error) {
      console.error('Error verifying login:', error);
      this._sessionConfig = undefined;
      return false;
    }
  }

  public async syncUserKeys(): Promise<void> {
    try {
      if (!this.isLoggedIn()) {
        throw new BaseError('User must be logged in to sync user keys');
      }

      const res = await BffClientRepository.GetUserKeys(this);
      this._userKeys = res;

      console.log(res);
    } catch (error) {
      console.error('Error syncing user keys:', error);
      throw error;
    }
  }

  public async getAuthorizationToken() {
    const sessionPriv = this._sessionConfig?.sessionPrivKey;
    const sessionPub = this._sessionConfig?.sessionPubKey;

    if (sessionPriv === undefined || sessionPub === undefined) {
      throw new BaseError('Session keys are not set');
    }

    const data = {
      expire_at: Math.round(Date.now() / 1000) + 60 * 90,
      session_pub_key: sessionPub,
    };

    const payload = {
      type: 'ecdsa_uncompressed',
      data: data,
      data_signature: await viemSignMessage({
        message: JSON.stringify(data),
        privateKey: sessionPriv,
      }),
    };

    return btoa(JSON.stringify(payload));
  }

  get userSWA(): Hex | undefined {
    return this._sessionConfig?.userSWA;
  }

  get clientSWA(): Hex | undefined {
    return this._clientConfig.clientSWA;
  }

  public paymasterData({
    nonce,
    validUntil,
    validAfter,
  }: {
    nonce: string;
    validUntil: Date | number | bigint;
    validAfter?: Date | number | bigint;
  }) {
    if (!this.isLoggedIn())
      throw new BaseError('User must be logged in to generate paymaster data');
    return generatePaymasterData(
      this._clientConfig.clientSWA,
      this._clientConfig.clientPrivKey,
      nonce,
      validUntil,
      validAfter,
    );
  }

  public async executeUserOp(userop: UserOp): Promise<string> {
    if (!this.isLoggedIn()) {
      throw new BaseError('User must be logged in to execute user operation');
    }
    validateUserOp(userop);
    try {
      return await BffClientRepository.execute(this, userop);
    } catch (error) {
      console.error('Error executing user operation:', error);
      throw error;
    }
  }

  public async signUserOp(userop: UserOp): Promise<UserOp> {
    if (!this.isLoggedIn()) {
      throw new BaseError('User must be logged in to sign user operation');
    }
    validateUserOp(userop);
    const privateKey = this._sessionConfig?.sessionPrivKey;

    if (privateKey === undefined) {
      throw new BaseError('Session keys are not set');
    }

    const packeduserop = generatePackedUserOp(userop);
    const hash = generateUserOpHash(this, packeduserop);
    const sig = await viemSignMessage({
      message: {
        raw: fromHex(hash, 'bytes'),
      },
      privateKey: privateKey,
    });

    userop.signature = sig;

    return userop;
  }

  public async signMessage(
    message: string,
  ): Promise<string | RpcError | undefined> {
    if (!this.isLoggedIn()) {
      throw new BaseError('User must be logged in to sign message');
    }

    if (this._sessionConfig === undefined) {
      throw new BaseError('Session keys are not set');
    }

    if (this._userKeys === undefined) {
      throw new BaseError('User keys are not set');
    }

    const signPayload = await generateSignMessagePayload(
      this._userKeys,
      this._sessionConfig,
      message,
      'EIP191',
    );

    try {
      const res = await BffClientRepository.SignMessage(this, signPayload);
      return `0x${res[0]?.signature}`;
    } catch (error) {
      if (error instanceof RpcError) {
        return error;
      }
      throw error;
    }
  }

  public async signTypedData(
    data: string | object,
  ): Promise<string | RpcError | undefined> {
    if (!this.isLoggedIn()) {
      throw new BaseError('User must be logged in to sign message');
    }

    if (this._sessionConfig === undefined) {
      throw new BaseError('Session keys are not set');
    }

    if (this._userKeys === undefined) {
      throw new BaseError('User keys are not set');
    }

    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }

    //TODO: Validate Data against EIP712 schema

    const signPayload = await generateSignMessagePayload(
      this._userKeys,
      this._sessionConfig,
      data,
      'EIP712',
    );

    try {
      const res = await BffClientRepository.SignMessage(this, signPayload);
      return `0x${res[0]?.signature}`;
    } catch (error) {
      if (error instanceof RpcError) {
        return error;
      }
      throw error;
    }
  }

  public isLoggedIn(): boolean {
    return this._sessionConfig !== undefined;
  }

  public sessionClear(): void {
    this._sessionConfig = undefined;
  }
}

export default OktoClient;
export type { SessionConfig, Env } from './types.js';
