import {
  isAddress,
  isHexString,
  isPrivateKey,
  isPublicKey,
  isValidEmail,
  isValidPhoneNumber,
} from '@/utils/customValidators.js';
import { z } from 'zod';

/**
 * ---------------------------------------------------------------------------
 * Schemas
 * ---------------------------------------------------------------------------
 */

// **Schema for Okto Client configuration**
export const OktoClientConfigSchema = z.object({
  environment: z.enum(['sandbox', 'staging']),
  clientPrivateKey: isPrivateKey(),
  clientSWA: isAddress('Invalid clientSWA format'),
});

// **Schema for Authentication Data**
export const AuthDataSchema = z.union([
  z.object({
    idToken: z.string(),
    provider: z.literal('google'),
  }),
  z.object({
    authToken: z.string(),
    provider: z.literal('okto'),
  }),
  z.object({
    idToken: z.string(),
    provider: z.literal('okto'),
  }),
]);

// **Schema for Session Configuration**
export const SessionConfigSchema = z.object({
  sessionId: z.string(),
  sessionKey: z.string(),
});

// **Schema for Client Configuration**
export const ClientConfigSchema = z.object({
  clientPrivateKey: isPrivateKey(),
  clientPubKeyKey: isPublicKey(),
  clientSWA: isAddress(),
});

// **Schema for User Operation**
export const UserOpSchema = z.object({
  sender: isAddress('Invalid sender address format'),
  nonce: isHexString('Invalid nonce format'),
  paymaster: isAddress('Invalid paymaster address format'),
  callGasLimit: isHexString('Invalid call gas limit format'),
  verificationGasLimit: isHexString('Invalid verification gas limit format'),
  preVerificationGas: isHexString('Invalid pre-verification gas format'),
  maxFeePerGas: isHexString('Invalid max fee per gas format'),
  maxPriorityFeePerGas: isHexString('Invalid max priority fee per gas format'),
  paymasterPostOpGasLimit: isHexString(
    'Invalid paymaster post-op gas limit format',
  ),
  paymasterVerificationGasLimit: isHexString(
    'Invalid paymaster verification gas limit format',
  ),
  callData: isHexString('Invalid call data format'),
  paymasterData: isHexString('Invalid paymaster data format'),
});

// **Schema for Email Contact**
export const EmailContactSchema = z.object({
  email: isValidEmail(),
});

// **Schema for Phone Contact**
export const PhoneContactSchema = z.object({
  phoneNumber: isValidPhoneNumber(),
});

export const validateOktoClientConfig = (data: unknown) =>
  OktoClientConfigSchema.parse(data);
export const validateAuthData = (data: unknown) => AuthDataSchema.parse(data);
export const validateSessionConfig = (data: unknown) =>
  SessionConfigSchema.parse(data);
export const validateClientConfig = (data: unknown) =>
  ClientConfigSchema.parse(data);
export const validateUserOp = (data: unknown) => UserOpSchema.parse(data);
export const validateEmail = (email: string) =>
  EmailContactSchema.parse({ email }).email;
export const validatePhoneNumber = (phoneNumber: string) =>
  PhoneContactSchema.parse({ phoneNumber }).phoneNumber;
export const validateContact = (
  contact: string,
  method: 'email' | 'whatsapp',
): string | null => {
  try {
    if (method === 'email') {
      return validateEmail(contact);
    } else if (method === 'whatsapp') {
      return validatePhoneNumber(contact);
    }
    return null;
  } catch (error) {
    return null;
  }
};
