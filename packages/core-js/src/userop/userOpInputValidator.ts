import { z, ZodError } from 'zod';
import {
  isHexString,
  isTokenId,
  isUppercaseAlpha,
} from '@/utils/customValidators.js';
import { BaseError } from '@/errors/base.js';

/**
 * Schema for NFT Collection Creation parameters validation.
 */
export const NFTCollectionCreationSchema = z
  .object({
    caip2Id: z
      .string({
        required_error: 'CAIP2 ID is required',
      })
      .min(1, 'CAIP2 ID cannot be blank')
      .refine(
        (val) => val.trim() === val,
        'CAIP2 ID cannot have leading or trailing spaces',
      ),
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
    symbol: isUppercaseAlpha('Symbol must contain only uppercase letters'),
    type: z.enum(['ERC721', 'ERC1155']),
  })
  .strict();

/**
 * Schema for NFT Transfer validation.
 */
export const NFTTransferIntentParamsSchema = z
  .object({
    caip2Id: z
      .string({
        required_error: 'CAIP2 ID is required',
      })
      .min(1, 'CAIP2 ID cannot be blank')
      .refine(
        (val) => val.trim() === val,
        'CAIP2 ID cannot have leading or trailing spaces',
      ),
    collectionAddress: isHexString('Invalid collection address format'),
    nftId: isTokenId(
      'Invalid NFT ID format – must be numeric or hexadecimal',
      true,
    )
      .transform((id) => Number(id))
      .refine((n) => n >= 0, 'NFT ID cannot be negative'),
    recipientWalletAddress: z
      .string()
      .min(1, 'Recipient wallet address cannot be empty'),
    amount: z
      .number()
      .int('Amount must be an integer')
      .min(1, 'Minimum transfer amount is 1')
      .default(1),
    nftType: z.enum(['ERC721', 'ERC1155']),
  })
  .strict()
  .refine((obj) => obj.nftType !== 'ERC721' || obj.amount === 1, {
    message: 'ERC721 transfers must have amount exactly 1',
    path: ['amount'],
  });

/**
 * Schema for Raw Transaction validation.
 */
export const RawTransactionSchema = z
  .object({
    from: isHexString('Invalid from address format'),
    to: isHexString('Invalid to address format'),
    data: isHexString('Invalid transaction data format').optional(),
    value: z
      .union([
        z.number().nonnegative('Transaction value cannot be negative'),
        z.bigint().nonnegative('Transaction value cannot be negative'),
      ])
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
export const RawTransactionIntentParamsSchema = z // TODO: add a check against in memory array fetched from BE at init
  .object({
    caip2Id: z
      .string({
        required_error: 'CAIP2 ID is required',
      })
      .min(1, 'CAIP2 ID cannot be blank')
      .refine(
        (val) => val.trim() === val,
        'CAIP2 ID cannot have leading or trailing spaces',
      ),
    transaction: RawTransactionSchema,
  })
  .strict();

/**
 * Schema for Token Transfer validation.
 */
export const TokenTransferIntentParamsSchema = z
  .object({
    caip2Id: z
      .string()
      .min(1, 'caip2Id cannot be blank')
      .refine(
        (val) => val.trim() === val,
        'caip2Id cannot have leading or trailing spaces',
      ),
    recipient: z
      .string()
      .regex(/^0x[a-fA-F0-9]+$/, 'Invalid recipient address format'),
    token: z.string(),
    amount: z.union([
      z.number().gt(0, 'Amount must be greater than 0'),
      z.bigint().gt(0n, 'Amount must be greater than 0'),
    ]),
  })
  .strict();

/**
 * Schema for Token Swap Intent parameters validation.
 */
export const TokenSwapIntentParamsSchema = z
  .object({
    // Chain and token information
    fromChainCaip2Id: z
      .string({
        required_error: 'Source chain CAIP2 ID is required',
      })
      .min(1, 'Source chain CAIP2 ID cannot be blank')
      .refine(
        (val) => val.trim() === val,
        'Source chain CAIP2 ID cannot have leading or trailing spaces',
      ),
    toChainCaip2Id: z
      .string({
        required_error: 'Destination chain CAIP2 ID is required',
      })
      .min(1, 'Destination chain CAIP2 ID cannot be blank')
      .refine(
        (val) => val.trim() === val,
        'Destination chain CAIP2 ID cannot have leading or trailing spaces',
      ),
    fromChainTokenAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]+$/, 'Invalid source token address format'),
    toChainTokenAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]+$/, 'Invalid destination token address format'),

    // Amount information
    fromChainTokenAmount: z.union([
      z.string().regex(/^\d+$/, 'Token amount must be a positive number'),
      z.number().positive('Token amount must be positive'),
      z.bigint().positive('Token amount must be positive'),
    ]),
    minToTokenAmount: z
      .union([
        z
          .string()
          .regex(/^\d+$/, 'Minimum token amount must be a positive number')
          .optional(),
        z
          .number()
          .nonnegative('Minimum token amount cannot be negative')
          .optional(),
        z
          .bigint()
          .nonnegative('Minimum token amount cannot be negative')
          .optional(),
      ])
      .optional(),

    // Fee information
    sameChainFee: z.string().optional(),
    sameChainFeeCollector: z.string().optional(),
    crossChainFee: z.string().optional(),
    crossChainFeeCollector: z.string().optional(),

    // Route and slippage
    routeId: z.string().optional(),
    slippage: z.string().optional(),

    // Advanced settings
    advancedSettings: z.record(z.unknown()).optional(),
  })
  .strict()
  .refine(
    (data) => {
      // Ensure fee collector is provided if fee is specified
      if (data.sameChainFee && !data.sameChainFeeCollector) {
        return false;
      }
      if (data.crossChainFee && !data.crossChainFeeCollector) {
        return false;
      }
      return true;
    },
    {
      message: 'Fee collector address must be provided when specifying a fee',
      path: ['feeCollector'],
    },
  );

export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BaseError(
        `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`,
      );
    }
    throw error;
  }
};
