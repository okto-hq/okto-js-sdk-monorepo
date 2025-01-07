import BffClientRepository from '@/api/bff.js';
import GatewayClientRepository from '@/api/gateway.js';
import { globalConfig } from '@/config/index.js';
import type {
  AuthData,
  AuthenticatePayloadParam,
  AuthenticateResult,
  AuthSessionData,
} from '@/types/gateway/authenticate.js';
import {
  createSessionKeyPair,
  generatePaymasterAndData,
  generateUUID,
  getPublicKey,
  signPayload,
} from '@/utils/index.js';

class Auth {
  // -------------------- Constants  -------------------- //
  private HOURS_IN_MS = 60 * 60 * 1000;

  // -------------------- Private Methods -------------------- //

  /**
   * Generates the authenticate payload.
   * It creates the session data, signs the payload, and returns the authenticate payload.
   *
   * @param {AuthData} authData The authentication data.
   * @param {string} sessionPub The session public key.
   * @param {string} sessionPriv The session private key.
   * @param {string} vendorPriv The vendor private key.
   * @returns {AuthenticatePayloadParam} The authenticate payload.
   */
  private _generateAuthenticatePayload(
    authData: AuthData,
    sessionPub: string,
    sessionPriv: string,
    vendorPriv: string,
  ): AuthenticatePayloadParam {
    const payload: AuthenticatePayloadParam = <AuthenticatePayloadParam>{};

    payload.authData = authData;

    payload.sessionData = <AuthSessionData>{};
    payload.sessionData.nonce = generateUUID();
    payload.sessionData.vendorAddress = getPublicKey(vendorPriv);
    payload.sessionData.sessionPk = sessionPub;
    payload.sessionData.maxPriorityFeePerGas = ''; //TODO: Get from Bundler
    payload.sessionData.maxFeePerGas = ''; //TODO: Get from Bundler
    payload.sessionData.paymaster = globalConfig.env.paymasterAddress;
    payload.sessionData.paymasterData = generatePaymasterAndData(
      vendorPriv,
      new Date(Date.now() + 6 * this.HOURS_IN_MS),
    );

    payload.additionalData = ''; //TODO: Add any additional data needed during testing

    payload.authDataVendorSign = signPayload(authData, vendorPriv);
    payload.sessionDataVendorSign = signPayload(
      payload.sessionData,
      vendorPriv,
    );

    payload.authDataUserSign = signPayload(authData, sessionPriv);
    payload.sessionDataUserSign = signPayload(payload.sessionData, sessionPriv);

    return payload;
  }

  // -------------------- Public Methods -------------------- //

  /**
   * Logs in the user using OAuth.
   * It generates a session key pair, creates an authenticate payload, and sends it to the Gateway service.
   * If the response is valid, it updates the user session.
   *
   * @param {AuthData} authData The authentication data.
   * @returns {Promise<AuthenticateResult>} A promise that resolves to the authentication result.
   */
  async loginUsingOAuth(authData: AuthData): Promise<AuthenticateResult> {
    const vendorPrivateKey = globalConfig.authOptions.vendorPrivKey;
    const { uncompressedPublicKeyHex, privateKeyHex } = createSessionKeyPair();

    const authPayload = this._generateAuthenticatePayload(
      authData,
      uncompressedPublicKeyHex,
      privateKeyHex,
      vendorPrivateKey,
    );

    const authRes = await GatewayClientRepository.authenticate(authPayload);

    //TODO: Check if the response is valid

    globalConfig.updateUserSession(uncompressedPublicKeyHex, privateKeyHex);

    return authRes;
  }

  /**
   * Verifies if the user is logged in.
   * If user is not logged in, it clears the auth options.
   *
   * @returns {Promise<boolean>} A promise that resolves to a boolean value indicating if the user is logged in.
   */
  async verifyLogin(): Promise<boolean> {
    try {
      await BffClientRepository.verifySession();
      return true;
    } catch {
      globalConfig.clearAuthOptions();
      return false;
    }
  }
}

export default Auth;
