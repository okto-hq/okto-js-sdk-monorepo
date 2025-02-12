import type { Hex } from '@/types/core.js';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';

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

  get ethereumAddress(): Hex {
    // Remove the first byte (public key prefix)
    const publicKeyWithoutPrefix = this.uncompressedPublicKey.slice(1);
    const hash = keccak_256(publicKeyWithoutPrefix);
    // Take last 20 bytes and convert to hex with 0x prefix
    return `0x${Buffer.from(hash.slice(-20)).toString('hex')}`;
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

// TODO: Deprecate this function
export function getPublicKey(privateKey: string): string {
  privateKey = privateKey.replace('0x', '');
  return Buffer.from(secp256k1.getPublicKey(privateKey, false)).toString('hex');
}
