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

export function nonceToHex(
  nonce: string,
  opts?: { padding?: number | undefined },
): Hex {
  return toHex(nonceToBigInt(nonce), {
    size: opts?.padding || 32,
  });
}

export function bigintToHex(
  data: bigint,
  opts?: { padding?: number | undefined },
): Hex {
  return toHex(data, {
    size: opts?.padding || 32,
  });
}

export function generateNonce(): bigint {
  return nonceToBigInt(uuidv4());
}

export function generateUUID() {
  return uuidv4();
}

function hexToBytes32(hex: string): Hex {
  // Remove '0x' if it exists
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }

  // Ensure the string length is 64 (32 bytes) by padding with zeros
  return `0x${hex.padStart(64, '0')}`;
}

export function convertUUIDToInt(uuid: string): Hex {
  const uuidBytes = uuidParse(uuid);
  let bigInt = BigInt(0);

  for (let i = 0; i < uuidBytes.length; i++) {
    if (uuidBytes[i] !== undefined) {
      bigInt = (bigInt << BigInt(8)) | BigInt(uuidBytes[i]!);
    }
  }

  return hexToBytes32(bigInt.toString(16));
}

export function updateHexPadding(
  hexString: string,
  paddingLength: number,
): Hex {
  // Remove '0x' if present
  const cleanHex = hexString.replace('0x', '');

  // Validate hex string
  if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
    throw new Error('Invalid hex string');
  }

  // If hex is longer than padding, truncate from left
  if (cleanHex.length > paddingLength) {
    return `0x${cleanHex.slice(-paddingLength)}`;
  }

  // Add leading zeros to match padding length
  const paddedHex = cleanHex.padStart(paddingLength, '0');

  return `0x${paddedHex}`;
}
