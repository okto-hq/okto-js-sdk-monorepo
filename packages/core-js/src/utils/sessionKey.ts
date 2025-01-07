import { secp256k1 } from '@noble/curves/secp256k1';

export function createSessionKeyPair() {
  const privateKey = secp256k1.utils.randomPrivateKey();
  const uncompressedPublicKey = secp256k1.getPublicKey(privateKey, false);

  return {
    privateKey,
    uncompressedPublicKey,
    privateKeyHex: Buffer.from(privateKey).toString('hex'),
    uncompressedPublicKeyHex: Buffer.from(uncompressedPublicKey).toString(
      'hex',
    ),
  };
}

export function signPayload(
  payload: string | object,
  privateKey: string,
): string {
  if (typeof payload === 'object') {
    payload = JSON.stringify(payload);
  }

  const sig = secp256k1.sign(payload, privateKey);

  return sig.toCompactHex();
}

export function verifySignature(
  payload: string,
  signature: string,
  publicKey: string,
) {
  return secp256k1.verify(payload, signature, publicKey);
}

export function getPublicKey(privateKey: string): string {
  return Buffer.from(secp256k1.getPublicKey(privateKey, false)).toString('hex');
}
