import type {
  GetUserKeysResult,
  SignMessageParams,
} from '@/types/gateway/signMessage.js';
import { generateUUID } from '@/utils/nonce.js';
import crypto from 'crypto';
import { canonicalize } from 'json-canonicalize';
import { signMessage } from 'viem/accounts';
import type { SessionConfig } from './types.js';

export async function generateSignMessagePayload(
  userKeys: GetUserKeysResult,
  session: SessionConfig,
  message: string,
  signType: 'EIP191' | 'EIP712',
): Promise<SignMessageParams> {
  //* Order of keys is important here
  const raw_message_to_sign = {
    requestType: signType,
    signingMessage: message,
  };

  const transaction_id = generateUUID();

  const base64_message_to_sign = {
    [transaction_id]: raw_message_to_sign,
  };

  const base64_message = canonicalize(base64_message_to_sign);

  const setup_options = {
    t: 3, // Threshold; 3,5 MPC
    key_id: userKeys.ecdsaKeyId,
    message: base64_message,
    // TODO: Add support for other signing algorithms (e.g. ed25519)
    signAlg: 'secp256k1',
  };

  const canonicalize_setup_options = canonicalize(setup_options);

  const sha_1 = crypto
    .createHash('sha256')
    .update(canonicalize_setup_options, 'utf8')
    .digest();
  const sha_2 = crypto.createHash('sha256').update(sha_1).digest();
  const challenge = sha_2.toString('hex');

  const enc = new TextEncoder();
  const rawMessagePayload = enc.encode(
    canonicalize({
      setup: setup_options,
      challenge: challenge,
    }),
  );

  const sig = await signMessage({
    message: {
      raw: rawMessagePayload,
    },
    privateKey: session.sessionPrivKey,
  });

  const payload: SignMessageParams = {
    data: {
      userData: {
        userSWA: session.userSWA,
        jobId: generateUUID(),
        sessionPk: session.sessionPubKey,
      },
      transactions: [
        {
          transactionId: transaction_id,
          method: signType,
          signingMessage: message,
          userSessionSignature: sig,
        },
      ],
    },
  };

  return payload;
}
