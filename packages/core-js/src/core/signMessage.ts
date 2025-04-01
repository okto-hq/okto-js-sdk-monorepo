import type {
  GetUserKeysResult,
  SignMessageParams,
} from '@/types/gateway/signMessage.js';
import { generateUUID } from '@/utils/nonce.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
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

  // Replace Node.js crypto with @noble/hashes implementation
  const sha_1 = sha256(new TextEncoder().encode(canonicalize_setup_options));
  const sha_2 = sha256(sha_1);
  const challenge = bytesToHex(sha_2); // Convert Uint8Array to hex string

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