import type { Hex } from '@/types/core.js';
import { secp256k1 } from '@noble/curves/secp256k1';

export class SessionKey {
  private priv: Uint8Array<ArrayBufferLike>;

  constructor() {
    this.priv = secp256k1.utils.randomPrivateKey();
  }

  get privateKey() {
    return this.priv;
  }

  get uncompressedPublicKey() {
    return secp256k1.getPublicKey(this.priv, false);
  }

  get compressedPublicKey() {
    return secp256k1.getPublicKey(this.priv, true);
  }

  get privateKeyHex() {
    return Buffer.from(this.priv).toString('hex');
  }

  get uncompressedPublicKeyHex() {
    return Buffer.from(this.uncompressedPublicKey).toString('hex');
  }

  get privateKeyHexWith0x(): Hex {
    return `0x${Buffer.from(this.priv).toString('hex')}`;
  }

  get uncompressedPublicKeyHexWith0x(): Hex {
    return `0x${Buffer.from(this.uncompressedPublicKey).toString('hex')}`;
  }

  static create() {
    return new SessionKey();
  }

  verifySignature({
    payload,
    signature,
  }: {
    payload: string;
    signature: string;
  }) {
    return secp256k1.verify(payload, signature, this.uncompressedPublicKey);
  }
}

// export function createSessionKeyPair() {
//   const privateKey = secp256k1.utils.randomPrivateKey();
//   const uncompressedPublicKey = secp256k1.getPublicKey(privateKey, false);

//   return {
//     privateKey,
//     uncompressedPublicKey,
//     privateKeyHex: ('0x' + Buffer.from(privateKey).toString('hex')) as Hex,
//     uncompressedPublicKeyHex: ('0x' +
//       Buffer.from(uncompressedPublicKey).toString('hex')) as Hex,
//   };
// }

// TODO: Deprecate this function
export function signPayload(
  payload: string | object,
  privateKey: string,
): string {
  if (typeof payload === 'object') {
    payload = JSON.stringify(payload);
  }

  payload = payload.replace('0x', '');
  privateKey = privateKey.replace('0x', '');

  const sig = secp256k1.sign(payload, privateKey);

  return sig.toCompactHex();
}

// TODO: Deprecate this function
export function getPublicKey(privateKey: string): string {
  privateKey = privateKey.replace('0x', '');
  return Buffer.from(secp256k1.getPublicKey(privateKey, false)).toString('hex');
}
