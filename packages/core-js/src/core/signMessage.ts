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
  const raw_message_to_sign = {
    message: message,
    requestType: signType,
  };

  const transaction_id = generateUUID();

  const base64_message_to_sign = {
    [transaction_id]: canonicalize(raw_message_to_sign),
  };

  const base64_message = Buffer.from(
    canonicalize(base64_message_to_sign),
  ).toString('base64');

  const setup_options = {
    t: 3, // Threshold; 3,5 MPC
    key_id: userKeys.ecdsaKeyId,
    message: base64_message,
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
  const paylaod = enc.encode(
    canonicalize({
      challenge: challenge,
      setup: setup_options,
    }),
  );

  const sig = await signMessage({
    message: {
      raw: paylaod,
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
