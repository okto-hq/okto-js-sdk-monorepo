import type { Hex } from '@/types/core.js';
import type {
  GetUserKeysResult,
  SignMessageParams,
} from '@/types/gateway/signMessage.js';
import { generateUUID } from '@/utils/nonce.js';
import { sha256 } from '@noble/hashes/sha2';
import { canonicalize } from 'json-canonicalize';
import { toHex } from 'viem';
import { signMessage } from 'viem/accounts';
import type OktoClient from './index.js';

export async function generateSignMessagePayload(
  oc: OktoClient,
  userKeys: GetUserKeysResult,
  clientPrivateKey: Hex,
  message: string,
  signType: 'EIP191',
): Promise<SignMessageParams> {
  const raw_message_to_sign = {
    message: message,
    requestType: signType,
  };

  const base64_message_to_sign = {
    transaction_id: canonicalize(raw_message_to_sign),
  };

  const base64_message = Buffer.from(
    JSON.stringify(base64_message_to_sign),
    'utf-8',
  ).toString('base64');

  const setup_options = {
    t: 3, // Threshold; 3,5 MPC
    key_id: userKeys.ecdsaKeyId,
    message: base64_message,
    signAlg: 'secp256k1',
  };

  const canonicalize_setup_options = canonicalize(setup_options);

  const sha_1 = sha256(canonicalize_setup_options);
  const sha_2 = sha256(sha_1);

  const challenge = toHex(sha_2);

  const paylaod = {
    challenge: challenge,
    setup: setup_options,
  };

  const enc = new TextEncoder();
  const sig = await signMessage({
    message: {
      raw: enc.encode(JSON.stringify(paylaod)),
    },
    privateKey: clientPrivateKey,
  });

  const payload: SignMessageParams = {
    data: {
      userData: {
        jobId: generateUUID(),
        sessionPk: clientPrivateKey,
      },
      transactions: [
        {
          transactionId: generateUUID(),
          method: signType,
          signingMessage: message,
          userSessionSignature: sig,
        },
      ],
    },
  };

  return payload;
}
