import type { Hex } from '@/types/core.js';
import { parse as uuidParse, v4 as uuidv4 } from 'uuid';
import { toHex } from 'viem';

export function nonceToBigInt(nonce: string): bigint {
  const uuidBytes = uuidParse(nonce); // Get the 16-byte array of the UUID
  let bigInt = BigInt(0);

  for (let i = 0; i < uuidBytes.length; i++) {
    if (uuidBytes[i] !== undefined) {
      bigInt = (bigInt << BigInt(8)) | BigInt(uuidBytes[i]!);
    }
  }

  return bigInt;
}

export function nonceToHex(nonce: string): Hex {
  return toHex(nonceToBigInt(nonce), {
    size: 32,
  });
}

export function generateNonce(): bigint {
  return nonceToBigInt(uuidv4());
}

export function generateUUID() {
  return uuidv4();
}

function hexToBytes32(hex: string) {
  // Remove '0x' if it exists
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }

  // Ensure the string length is 64 (32 bytes) by padding with zeros
  return '0x' + hex.padStart(64, '0');
}

export function convertUUIDToInt(uuid: string) {
  // Convert UUID to BigInt
  const uuidBytes = uuidParse(uuid); // Get the 16-byte array of the UUID
  let bigInt = BigInt(0);

  for (let i = 0; i < uuidBytes.length; i++) {
    if (uuidBytes[i] !== undefined) {
      bigInt = (bigInt << BigInt(8)) | BigInt(uuidBytes[i]!);
    }
  }
  // console.log("UUID as BigInt:", hexToBytes32(bigInt.toString()));

  return hexToBytes32(bigInt.toString(16));
}
