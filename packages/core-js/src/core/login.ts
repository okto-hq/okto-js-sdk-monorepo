import type { Hash, Hex } from '@/types/core.js';
import type {
  AuthenticatePayloadParam,
  AuthSessionData,
} from '@/types/gateway/authenticate.js';
import type { AuthData } from '@/types/index.js';
import {
  Constants,
  generatePaymasterAndData,
  generateUUID,
  SessionKey,
} from '@/utils/index.js';
import { signMessage } from 'viem/accounts';
import type OktoClient from './index.js';

/**
 * Generates the authenticate payload.
 * It creates the session data, signs the payload, and returns the authenticate payload.
 *
 * @param {AuthData} authData The authentication data.
 * @param {string} sessionPub The session public key.
 * @param {string} sessionPriv The session private key.
 * @param {string} clientPriv The client private key.
 * @returns {AuthenticatePayloadParam} The authenticate payload.
 */
export async function generateAuthenticatePayload(
  oc: OktoClient,
  authData: AuthData,
  sessionKey: SessionKey,
  clientSWA: Hex,
  clientPriv: Hash,
): Promise<AuthenticatePayloadParam> {
  const nonce = generateUUID();

  const payload: AuthenticatePayloadParam = <AuthenticatePayloadParam>{};

  payload.authData = authData;

  payload.sessionData = <AuthSessionData>{};
  payload.sessionData.nonce = nonce;
  payload.sessionData.clientSWA = clientSWA;
  payload.sessionData.sessionPk = sessionKey.uncompressedPublicKeyHexWith0x;
  payload.sessionData.maxPriorityFeePerGas = '0xBA43B7400'; //TODO: Get from Bundler
  payload.sessionData.maxFeePerGas = '0xBA43B7400'; //TODO: Get from Bundler
  payload.sessionData.paymaster = oc.env.paymasterAddress;
  payload.sessionData.paymasterData = await generatePaymasterAndData(
    clientSWA,
    clientPriv,
    nonce,
    new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  );

  // payload.authDataVendorSign = await signMessage({
  //   message: {
  //     raw: toBytes(JSON.stringify(authData)),
  //   },
  //   privateKey: vendorPriv,
  // });
  // payload.authDataUserSign = await signMessage({
  //   message: {
  //     raw: toBytes(JSON.stringify(authData)),
  //   },
  //   privateKey: sessionKey.privateKeyHexWith0x,
  // });

  payload.sessionPkClientSignature = await signMessage({
    message: sessionKey.ethereumAddress,
    privateKey: clientPriv,
  });
  payload.sessionDataUserSignature = await signMessage({
    message: sessionKey.ethereumAddress,
    privateKey: sessionKey.privateKeyHexWith0x,
  });

  return payload;
}
