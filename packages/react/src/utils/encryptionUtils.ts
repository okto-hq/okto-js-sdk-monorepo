import { cbc } from '@noble/ciphers/aes';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || '';

const stringToUint8Array = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

const uint8ArrayToString = (arr: Uint8Array): string => {
  return new TextDecoder().decode(arr);
};

const uint8ArrayToBase64 = (arr: Uint8Array): string => {
  return Buffer.from(arr).toString('base64');
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  return new Uint8Array(Buffer.from(base64, 'base64'));
};

export const encryptData = (data: unknown): string => {
  try {
    const plaintext = stringToUint8Array(JSON.stringify(data));
    const key = stringToUint8Array(SECRET_KEY.padEnd(32, '\0').slice(0, 32));

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = cbc(key, iv).encrypt(plaintext);

    const combined = new Uint8Array([...iv, ...encrypted]);
    return uint8ArrayToBase64(combined);
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

export const decryptData = <T>(encryptedData: string): T | undefined => {
  try {
    const combined = base64ToUint8Array(encryptedData);

    const iv = combined.slice(0, 16);
    const encrypted = combined.slice(16);

    const key = stringToUint8Array(SECRET_KEY.padEnd(32, '\0').slice(0, 32));
    const decrypted = cbc(key, iv).decrypt(encrypted);

    const decryptedString = uint8ArrayToString(decrypted);

    return decryptedString ? JSON.parse(decryptedString) : undefined;
  } catch (error) {
    console.error('Decryption error:', error);
    return undefined;
  }
};
