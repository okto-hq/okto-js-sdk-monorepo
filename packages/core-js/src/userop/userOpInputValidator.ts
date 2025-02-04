import { z } from 'zod';
import type {
  NFTCollectionCreationIntentParams,
  NFTTransferIntentParams,
  RawTransactionIntentParams,
  TokenTransferIntentParams,
} from './types.js';

/**
 * ---------------------------------------------------------------------------
 * Common Regular Expressions
 * ---------------------------------------------------------------------------
 */
// Validates an alphanumeric string (hexadecimal characters only)
const ID_REGEX = /^[a-fA-F0-9]+$/;

// Validates a token ID that may be numeric or hexadecimal (optional "0x" prefix)
const TOKEN_ID_REGEX = /^(0x)?[a-fA-F0-9]+$/;

/**
 * ---------------------------------------------------------------------------
 * UserOpInputValidator Class
 * ---------------------------------------------------------------------------
 */
class UserOpInputValidator {
  /**
   * Schema for NFT Collection Creation parameters validation.
   */
  static NFTCollectionCreationSchema = z
    .object({
      networkId: z
        .string({
          required_error: 'NetworkId is required',
          invalid_type_error: 'NetworkId must be an alphanumeric string',
        })
        .regex(ID_REGEX, 'NetworkId must be an alphanumeric string'),
      name: z
        .string()
        .min(2, 'Collection name must be at least 2 characters')
        .max(50, 'Collection name cannot exceed 50 characters'),
      description: z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
      metadataUri: z
        .string()
        .url('Invalid metadata URL format')
        .refine(
          (uri) => uri.startsWith('https://'),
          'Metadata URI must use HTTPS protocol',
        ),
      symbol: z
        .string()
        .min(2, 'Symbol must be at least 2 characters')
        .max(10, 'Symbol cannot exceed 10 characters')
        .regex(/^[A-Z]+$/, 'Symbol must contain only uppercase letters'),
      type: z.literal('ERC721').or(z.literal('ERC1155')),
    })
    .strict();

  /**
   * Schema for NFT Transfer validation.
   */
  static NFTTransferIntentParamsSchema = z
    .object({
      networkId: z
        .string({
          required_error: 'NetworkId is required',
          invalid_type_error: 'NetworkId must be an alphanumeric string',
        })
        .regex(ID_REGEX, 'NetworkId must be an alphanumeric string'),
      collectionAddress: z.string(),
      nftId: z
        .string()
        .regex(
          TOKEN_ID_REGEX,
          'Invalid NFT ID format – must be numeric or hexadecimal',
        )
        .transform((id) => Number(id))
        .refine((n) => n >= 0, 'NFT ID cannot be negative'),
      recipientWalletAddress: z.string(),
      amount: z
        .number()
        .int('Amount must be an integer')
        .min(1, 'Minimum transfer amount is 1')
        .default(1),
      type: z.enum(['ERC721', 'ERC1155']),
    })
    .strict()
    .refine((obj) => obj.type !== 'ERC721' || obj.amount === 1, {
      message: 'ERC721 transfers must have amount exactly 1',
      path: ['amount'],
    });

  /**
   * Schema for Raw Transaction validation.
   */
  static RawTransactionSchema = z
    .object({
      from: z.string(),
      to: z.string(),
      data: z
        .string()
        .regex(/^0x[0-9a-fA-F]*$/, 'Invalid transaction data format')
        .optional(),
      value: z
        .number()
        .nonnegative('Transaction value cannot be negative')
        .optional(),
    })
    .strict()
    .refine(
      (tx) => !!tx.data || typeof tx.value !== 'undefined',
      'Transaction must include either data or value',
    );

  /**
   * Schema for Raw Transaction Intent Parameters.
   */
  static RawTransactionIntentParamsSchema = z
    .object({
      networkId: z
        .string({
          required_error: 'NetworkId is required',
          invalid_type_error: 'NetworkId must be an alphanumeric string',
        })
        .regex(ID_REGEX, 'NetworkId must be an alphanumeric string'),
      transaction: this.RawTransactionSchema,
    })
    .strict();

  /**
   * Schema for Token Transfer validation.
   */
  static TokenTransferIntentParamsSchema = z
    .object({
      networkId: z
        .string({
          required_error: 'NetworkId is required',
          invalid_type_error: 'NetworkId must be an alphanumeric string',
        })
        .regex(ID_REGEX, 'NetworkId must be an alphanumeric string'),
      recipientWalletAddress: z.string(),
      tokenAddress: z.string(),
      amount: z
        .number()
        .min(1, 'Transfer amount must be at least 1')
        .refine(
          (val) => val <= Number.MAX_SAFE_INTEGER,
          'Amount exceeds safe precision limit',
        ),
    })
    .strict();

  // ---------------------------------------------------------------------------
  // Validation Methods
  // ---------------------------------------------------------------------------

  static validateNFTCollectionCreationParams(
    data: NFTCollectionCreationIntentParams,
  ) {
    return this.NFTCollectionCreationSchema.parse(data);
  }

  static validateNFTTransferIntentParams(data: NFTTransferIntentParams) {
    return this.NFTTransferIntentParamsSchema.parse(data);
  }

  static validateRawTransactionIntentParams(data: RawTransactionIntentParams) {
    return this.RawTransactionIntentParamsSchema.parse(data);
  }

  static validateTokenTransferIntentParams(data: TokenTransferIntentParams) {
    return this.TokenTransferIntentParamsSchema.parse(data);
  }
}

export default UserOpInputValidator;
