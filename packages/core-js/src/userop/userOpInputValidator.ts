import { z, ZodError } from 'zod';
import { isHexString, isTokenId } from '@/utils/customValidators.js';
import { BaseError } from '@/errors/base.js';

/**
 * Schema for NFT Collection Creation parameters validation.
 */
export const NftCreateCollectionParamsSchema = z
  .object({
    caip2Id: z
      .string({
        required_error: 'CAIP2 ID is required',
      })
      .min(1, 'CAIP2 ID cannot be blank')
      .refine(
        (val) => val.trim() === val,
        'CAIP2 ID cannot have leading or trailing spaces',
      )
      .refine(
        (val) => val.toLowerCase().startsWith('aptos:'),
        'NFT Collection creation is only supported on Aptos chain',
      ),
    name: z
      .string({
        required_error: 'Collection name is required',
      })
      .min(1, 'Collection name cannot be empty')
      .max(100, 'Collection name cannot exceed 100 characters'),
    uri: z
      .string({
        required_error: 'URI is required',
      })
      .min(1, 'URI cannot be empty'),
    data: z
      .object({
        attributes: z.string().optional(),
        symbol: z.string().optional(),
        type: z.string().optional(),
        description: z.string().optional(),
      })
      .strict(),
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
    ).refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    }, 'NFT ID cannot be negative'),

    recipientWalletAddress: z
      .string()
      .min(1, 'Recipient wallet address cannot be empty'),

    amount: z
      .number()
      .int('Amount must be an integer')
      .min(1, 'Minimum transfer amount is 1')
      .default(1),
    nftType: z.string(),
  })
  .strict()
  .refine((obj) => obj.nftType !== 'ERC721' || obj.amount === 1, {
    message: 'ERC721 transfers must have amount exactly 1',
    path: ['amount'],
  });

export const NftMintParamsSchema = z
  .object({
    caip2Id: z
      .string({
        required_error: 'CAIP2 ID is required',
      })
      .min(1, 'CAIP2 ID cannot be blank'),
    nftName: z
      .string({
        required_error: 'NFT name is required',
      })
      .min(1, 'NFT name cannot be empty'),
    collectionAddress: z.string().optional(),
    uri: z
      .string({
        required_error: 'URI is required',
      })
      .min(1, 'URI cannot be empty'),
    data: z
      .object({
        recipientWalletAddress: z.string().optional(),
        description: z.string().optional(),
        properties: z
          .array(
            z.object({
              name: z.string(),
              type: z.number().int(),
              value: z.string(),
            }),
          )
          .optional(),
      })
      .strict(),
  })
  .strict();

export const AptosRawTransactionIntentParamsSchema = z
  .object({
    caip2Id: z
      .string({
        required_error: 'CAIP2 ID is required',
      })
      .min(1, 'CAIP2 ID cannot be blank')
      .refine(
        (val) => val.trim() === val,
        'CAIP2 ID cannot have leading or trailing spaces',
      )
      .refine(
        (val) => val.toLowerCase().startsWith('aptos:'),
        'CAIP2 ID must be for an Aptos chain',
      ),
    transactions: z
      .array(
        z.object({
          function: z
            .string({
              required_error: 'Function is required',
            })
            .min(1, 'Function cannot be empty'),
          typeArguments: z.array(z.string()).optional().default([]),
          functionArguments: z
            .array(
              z.union([
                z.string(),
                z.number(),
                z.boolean(),
                z.bigint(),
                z.null(),
                z.undefined(),
                z.instanceof(Uint8Array),
                z.instanceof(ArrayBuffer),
                z.array(
                  z.lazy(() =>
                    z.union([
                      z.string(),
                      z.number(),
                      z.boolean(),
                      z.bigint(),
                      z.null(),
                      z.undefined(),
                      z.instanceof(Uint8Array),
                      z.instanceof(ArrayBuffer),
                    ]),
                  ),
                ),
              ]),
            )
            .optional()
            .default([]),
        }),
        {
          required_error: 'At least one transaction is required',
        },
      )
      .min(1, 'At least one transaction is required'),
  })
  .strict();

/**
 * Schema for Raw Transaction validation.
 */
export const EvmRawTransactionSchema = z
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
export const EvmRawTransactionIntentParamsSchema = z // TODO: add a check against in memory array fetched from BE at init
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
    transaction: EvmRawTransactionSchema,
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
    recipient: z.string(),
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
    fromChainTokenAddress: z.string(),
    toChainTokenAddress: z.string(),

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

/** * Schema for Solana Raw Transaction Intent Parameters.
 * @property caip2Id - The CAIP-2 ID of the Solana network (e.g., "solana:mainnet").
 * @property transactions - An array of Solana transactions, each containing:
 *   - instructions: An array of instructions, where each instruction includes:
 *     - programId: The ID of the program to execute.
 *     - keys: An array of key objects, each with:
 *       - pubkey: The public key of the account.
 *       - isSigner: A boolean indicating if the key is a signer.
 *       - isWritable: A boolean indicating if the key is writable.
 *     - data: An array of numbers representing the instruction data.
 *   - signers: An array of public keys of the signers for the transaction.
 *   - feePayerAddress: The public key of the fee payer for the transaction.
 */
export const SolanaRawTransactionIntentParamsSchema = z.object({
  caip2Id: z.string().startsWith('solana:'),
  transactions: z.array(
    z.object({
      instructions: z.array(
        z.object({
          programId: z.string(),
          keys: z.array(
            z.object({
              pubkey: z.string(),
              isSigner: z.boolean(),
              isWritable: z.boolean(),
            }),
          ),
          data: z.array(z.number()),
        }),
      ),
      signers: z.array(z.string()),
      feePayerAddress: z.string(),
    }),
  ),
});
