import { z } from 'zod';
import type { Hash, Hex, UserOp } from '@/types/core.js';
import type { AuthData } from '@/types/index.js';
import type { Env, SessionConfig, VendorConfig } from './types.js';

/**
 * ---------------------------------------------------------------------------
 * Common Regular Expressions
 * ---------------------------------------------------------------------------
 */
const HEX_REGEX = /^0x[a-fA-F0-9]+$/;
const PRIVATE_KEY_REGEX = /^0x[a-fA-F0-9]{64}$/;
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const PUBLIC_KEY_REGEX = /^0x[a-fA-F0-9]{66}$/;

/**
 * ---------------------------------------------------------------------------
 * OktoClientInputValidator Class
 * ---------------------------------------------------------------------------
 */
export class OktoClientInputValidator {
  /**
   * Schema for Okto Client configuration.
   */
  static OktoClientConfigSchema = z.object({
    environment: z.enum(['sandbox', 'production']),
    vendorPrivKey: z.string().regex(PRIVATE_KEY_REGEX, 'Invalid vendor private key format'),
    vendorSWA: z.string().regex(ADDRESS_REGEX, 'Invalid vendor SWA format'),
  });

  /**
   * Schema for Authentication Data.
   */
  static AuthDataSchema = z.union([
    z.object({
      idToken: z.string(),
      provider: z.literal('google'),
    }),
    z.object({
      authToken: z.string(),
      provider: z.literal('okto'),
    }),
  ]);

  /**
   * Schema for Session Configuration.
   */
  static SessionConfigSchema = z.object({
    sessionId: z.string(),
    sessionKey: z.string(),
  });

  /**
   * Schema for Vendor Configuration.
   */
  static VendorConfigSchema = z.object({
    vendorPrivKey: z.string().regex(PRIVATE_KEY_REGEX, 'Invalid vendor private key format'),
    vendorPubKey: z.string().regex(PUBLIC_KEY_REGEX, 'Invalid vendor public key format'),
    vendorSWA: z.string().regex(ADDRESS_REGEX, 'Invalid vendor SWA format'),
  });

  /**
   * Schema for User Operation.
   */
  static UserOpSchema = z.object({
    sender: z.string().regex(ADDRESS_REGEX, 'Invalid sender address format'),
    nonce: z.string().regex(HEX_REGEX, 'Invalid nonce format'),
    paymaster: z.string().regex(ADDRESS_REGEX, 'Invalid paymaster address format'),
    callGasLimit: z.string().regex(HEX_REGEX, 'Invalid call gas limit format'),
    verificationGasLimit: z.string().regex(HEX_REGEX, 'Invalid verification gas limit format'),
    preVerificationGas: z.string().regex(HEX_REGEX, 'Invalid pre-verification gas format'),
    maxFeePerGas: z.string().regex(HEX_REGEX, 'Invalid max fee per gas format'),
    maxPriorityFeePerGas: z.string().regex(HEX_REGEX, 'Invalid max priority fee per gas format'),
    paymasterPostOpGasLimit: z.string().regex(HEX_REGEX, 'Invalid paymaster post-op gas limit format'),
    paymasterVerificationGasLimit: z.string().regex(HEX_REGEX, 'Invalid paymaster verification gas limit format'),
    callData: z.string().regex(HEX_REGEX, 'Invalid call data format'),
    paymasterData: z.string().regex(HEX_REGEX, 'Invalid paymaster data format'),
  });

  // ---------------------------------------------------------------------------
  // Validation Methods
  // ---------------------------------------------------------------------------

  static validateOktoClientConfig(data: unknown) {
    return this.OktoClientConfigSchema.parse(data);
  }

  static validateAuthData(data: unknown) {
    return this.AuthDataSchema.parse(data);
  }

  static validateSessionConfig(data: unknown) {
    return this.SessionConfigSchema.parse(data);
  }

  static validateVendorConfig(data: unknown) {
    return this.VendorConfigSchema.parse(data);
  }

  static validateUserOp(data: unknown) {
    return this.UserOpSchema.parse(data);
  }
}