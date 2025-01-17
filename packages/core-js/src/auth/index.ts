import BffClientRepository from '@/api/bff.js';
import GatewayClientRepository from '@/api/gateway.js';
import { globalConfig } from '@/config/index.js';
import type { Hash, Hex, User } from '@/types/core.js';
import type {
  AuthData,
  AuthenticatePayloadParam,
  AuthSessionData,
} from '@/types/gateway/authenticate.js';
import {
  Constants,
  generatePaymasterAndData,
  generateUUID,
  SessionKey,
} from '@/utils/index.js';
import { signMessage } from 'viem/accounts';

class Auth {
  user?: User;

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
  private async _generateAuthenticatePayload(
    authData: AuthData,
    sessionKey: SessionKey,
    vendorSWA: Hex,
    vendorPriv: Hash,
  ): Promise<AuthenticatePayloadParam> {
    const nonce = generateUUID();

    const payload: AuthenticatePayloadParam = <AuthenticatePayloadParam>{};

    payload.authData = authData;

    payload.sessionData = <AuthSessionData>{};
    payload.sessionData.nonce = nonce;
    payload.sessionData.vendorSWA = vendorSWA;
    payload.sessionData.sessionPk = sessionKey.uncompressedPublicKeyHex;
    payload.sessionData.maxPriorityFeePerGas = '0xBA43B7400'; //TODO: Get from Bundler
    payload.sessionData.maxFeePerGas = '0xBA43B7400'; //TODO: Get from Bundler
    payload.sessionData.paymaster = globalConfig.env.paymasterAddress;
    payload.sessionData.paymasterData = await generatePaymasterAndData(
      vendorSWA,
      vendorPriv,
      nonce,
      new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
    );

    payload.additionalData = ''; //TODO: Add any additional data needed during testing

    payload.authDataVendorSign = await signMessage({
      message: JSON.stringify(authData),
      privateKey: vendorPriv,
    });
    payload.sessionDataVendorSign = await signMessage({
      message: JSON.stringify(payload.sessionData),
      privateKey: vendorPriv,
    });

    payload.authDataUserSign = await signMessage({
      message: JSON.stringify(authData),
      privateKey: sessionKey.privateKeyHexWith0x,
    });
    payload.sessionDataUserSign = await signMessage({
      message: JSON.stringify(payload.sessionData),
      privateKey: sessionKey.privateKeyHexWith0x,
    });

    return payload;
  }

  /**
   * Logs in the user using OAuth.
   * It generates a session key pair, creates an authenticate payload, and sends it to the Gateway service.
   * If the response is valid, it updates the user session.
   *
   * @param {AuthData} authData The authentication data.
   * @returns {Promise<string>} A promise that resolves to the user address.
   */
  async loginUsingOAuth(authData: AuthData): Promise<string> {
    const vendorPrivateKey = globalConfig.authOptions.vendorPrivKey;
    const vendorSWA = globalConfig.authOptions.vendorSWA;
    const session = SessionKey.create();

    if (!vendorPrivateKey || !vendorSWA) {
      throw new Error('Vendor details not found');
    }

    const authPayload = await this._generateAuthenticatePayload(
      authData,
      session,
      vendorSWA,
      vendorPrivateKey,
    );
    console.log(authPayload);

    const authRes = await GatewayClientRepository.authenticate(authPayload);

    //TODO: Check if the response is valid

    // TODO: Update with SessionKey Object
    globalConfig.updateUserSession(
      session.uncompressedPublicKeyHexWith0x,
      session.privateKeyHexWith0x,
    );
    // globalConfig.updateVendorSWA(authRes.vendorAddress);
    globalConfig.updateUserSWA(authRes.userAddress as Hex);

    this.user = {
      ...authRes,
    };

    return authRes.userAddress;
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

  /**
   * Returns the user information.
   * If the user is not logged in, it returns undefined.
   */
  get userInfo(): User | undefined {
    return this.user;
  }
}

export default Auth;
