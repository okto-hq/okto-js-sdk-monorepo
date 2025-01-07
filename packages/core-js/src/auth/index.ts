import GatewayClientRepository from '@/api/gateway.js';
import { globalConfig } from '@/config/index.js';
import type {
  AuthData,
  AuthenticatePayloadParam,
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
  private HOURS_IN_MS = 60 * 60 * 1000;

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

  async loginUsingOAuth(authData: AuthData, vendorPrivateKey: string) {
    const { uncompressedPublicKeyHex, privateKeyHex } = createSessionKeyPair();

    const authPayload = this._generateAuthenticatePayload(
      authData,
      uncompressedPublicKeyHex,
      privateKeyHex,
      vendorPrivateKey,
    );

    const authRes = await GatewayClientRepository.authenticate(authPayload);

    //TODO: Check if the response is valid and store the session key pair in the global store or return it [TBD]

    return authRes;
  }
}

export default Auth;
