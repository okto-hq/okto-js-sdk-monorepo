import { ecb } from '@noble/ciphers/aes';

export function encryptData(data: string, password: string): string {
  const plaintext = new Uint8Array(new TextEncoder().encode(data));
  const key = new Uint8Array(new TextEncoder().encode(password));

  const ciphertext = ecb(key).encrypt(plaintext);

  return ciphertext.toString();
}
