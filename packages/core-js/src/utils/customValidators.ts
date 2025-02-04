import { z } from 'zod';
/**
 * ---------------------------------------------------------------------------
 * Custom Validators
 * ---------------------------------------------------------------------------
 */

// Validates a hexadecimal string (0x-prefixed)
const isHexString = (message?: string) =>
  z.custom<string>(
    (val) => typeof val === 'string' && /^0x[a-fA-F0-9]+$/.test(val),
    { message: message ?? 'Must be a valid hex string' },
  );

// Validates a private key (64-character hex string)
const isPrivateKey = (message?: string) =>
  z.custom<string>(
    (val) => typeof val === 'string' && /^0x[a-fA-F0-9]{64}$/.test(val),
    { message: message ?? 'Invalid vendor private key format' },
  );

// Validates an Ethereum address (40-character hex string)
const isAddress = (message?: string) =>
  z.custom<string>(
    (val) => typeof val === 'string' && /^0x[a-fA-F0-9]{40}$/.test(val),
    { message: message ?? 'Invalid Ethereum address format' },
  );

// Validates a public key (66-character hex string)
const isPublicKey = (message?: string) =>
  z.custom<string>(
    (val) => typeof val === 'string' && /^0x[a-fA-F0-9]{66}$/.test(val),
    { message: message ?? 'Invalid vendor public key format' },
  );

// Checks if a token ID is either numeric or hexadecimal (supports optional "0x" prefix)
const isTokenId = (message?: string) =>
  z.custom<string>(
    (val) => typeof val === 'string' && /^(0x)?[a-fA-F0-9]+$/.test(val),
    { message: message ?? 'Invalid Token ID format' },
  );

// Ensures a string contains only uppercase letters
const isUppercaseAlpha = (message?: string) =>
  z.custom<string>((val) => typeof val === 'string' && /^[A-Z]+$/.test(val), {
    message: message ?? 'Must contain only uppercase letters',
  });

export {
  isHexString,
  isPrivateKey,
  isAddress,
  isPublicKey,
  isTokenId,
  isUppercaseAlpha,
};
