import type OktoClient from '@/core/index.js';
import { BaseError } from '@/errors/base.js';
import { getChains } from '@/explorer/chain.js';
import type { Address, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import {
  encodeAbiParameters,
  encodeFunctionData,
  parseAbiParameters,
  toHex,
} from 'viem';
import { INTENT_ABI } from './abi.js';
import type {
  SolanaRawTransaction,
  SolanaRawTransactionIntentParams,
} from './types.js';
import {
  SolanaRawTransactionIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import BffClientRepository from '@/api/bff.js';

export async function svmRawTransaction(
  oc: OktoClient,
  data: SolanaRawTransactionIntentParams,
  feePayerAddress?: Address,
): Promise<UserOp> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }
  validateSchema(SolanaRawTransactionIntentParamsSchema, data);

  // if (!feePayerAddress) {
  //   throw new BaseError('feePayerAddress is required');
  // }

  const nonce = generateUUID();
  const jobParametersAbiType = '(string caip2Id, bytes[] transactions)';
  const gsnDataAbiType = `(bool isRequired, string[] requiredNetworks, ${jobParametersAbiType}[] tokens)`;

  const chains = await getChains(oc);
  const currentChain = chains.find(
    (chain) => chain.caipId.toLowerCase() === data.caip2Id.toLowerCase(),
  );

  if (!currentChain) {
    throw new BaseError(`Chain Not Supported`, {
      details: `${data.caip2Id} is not supported for this client`,
    });
  }

  if (!data.caip2Id.toLowerCase().startsWith('solana:')) {
    throw new BaseError('Invalid chain for Solana transaction', {
      details: `${data.caip2Id} is not a Solana chain`,
    });
  }

  const transactionsBytes = data.transactions.map((transaction) => {
    const solanaTransaction: SolanaRawTransaction = {
      instructions: transaction.instructions,
      signers: transaction.signers,
      feePayerAddress: transaction.feePayerAddress,
    };
    return toHex(Buffer.from(JSON.stringify(solanaTransaction), 'utf-8'));
  });

  const jobparam = encodeAbiParameters(
    parseAbiParameters(jobParametersAbiType),
    [
      {
        caip2Id: data.caip2Id,
        transactions: transactionsBytes,
      },
    ],
  );

  const calldata = encodeAbiParameters(
    parseAbiParameters('bytes4, address, uint256, bytes'),
    [
      Constants.EXECUTE_USEROP_FUNCTION_SELECTOR,
      oc.env.jobManagerAddress,
      Constants.USEROP_VALUE,
      encodeFunctionData({
        abi: INTENT_ABI,
        functionName: Constants.FUNCTION_NAME,
        args: [
          toHex(nonceToBigInt(nonce), { size: 32 }),
          oc.clientSWA,
          oc.userSWA,
          feePayerAddress,
          encodeAbiParameters(
            parseAbiParameters('(bool gsnEnabled, bool sponsorshipEnabled)'),
            [
              {
                gsnEnabled: currentChain.gsnEnabled ?? false,
                sponsorshipEnabled: currentChain.sponsorshipEnabled ?? false,
              },
            ],
          ),
          encodeAbiParameters(parseAbiParameters(gsnDataAbiType), [
            {
              isRequired: false,
              requiredNetworks: [],
              tokens: [],
            },
          ]),
          jobparam,
          Constants.INTENT_TYPE.RAW_TRANSACTION,
        ],
      }),
    ],
  );

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const gasEstimation = await BffClientRepository.estimateGasLimits(oc, {
    sender: oc.userSWA,
    nonce: toHex(nonceToBigInt(nonce), { size: 32 }),
    callData: calldata,
    paymasterData: paymasterData,
    paymaster: oc.env.paymasterAddress,
  });

  const gasPrice = await BffClientRepository.getUserOperationGasPrice(oc);

  const userOp: UserOp = {
    sender: oc.userSWA,
    nonce: toHex(nonceToBigInt(nonce), { size: 32 }),
    paymaster: oc.env.paymasterAddress,
    callGasLimit: gasEstimation.callGasLimit,
    verificationGasLimit: gasEstimation.verificationGasLimit,
    preVerificationGas: gasEstimation.preVerificationGas,
    maxFeePerGas: gasPrice.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit: gasEstimation.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit: gasEstimation.paymasterVerificationGasLimit,
    callData: calldata,
    paymasterData: paymasterData,
  };

  return userOp;
}
