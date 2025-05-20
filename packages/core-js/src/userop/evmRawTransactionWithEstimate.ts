import GatewayClientRepository from '@/api/gateway.js';
import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import { BaseError } from '@/errors/base.js';
import { getChains } from '@/explorer/chain.js';
import type { Address, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import { numberToHex, toHex } from 'viem';
import type {
  EVMRawTransaction,
  EVMRawTransactionIntentParams,
} from './types.js';
import {
  EvmRawTransactionIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import type {
  EvmRawTransactionEstimateRequest,
  EstimationDetails,
} from '@/types/bff/estimate.js';

/**
 * Creates a user operation for EVM raw transaction with estimation.
 *
 * This function initiates the process of executing raw EVM transactions by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for the raw transaction.
 * @param feePayerAddress - Optional fee payer address, defaults to Constants.FEE_PAYER_ADDRESS.
 * @returns The User Operation (UserOp) for the transaction and transfer details.
 */
export async function evmRawTransactionWithEstimate(
  oc: OktoClient,
  data: EVMRawTransactionIntentParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: EstimationDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }

  validateSchema(EvmRawTransactionIntentParamsSchema, data);

  if (!feePayerAddress) {
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
  }

  const transaction: EVMRawTransaction = {
    from: data.transaction.from,
    to: data.transaction.to,
    data: data.transaction.data ?? '0x',
    value: numberToHex(data.transaction.value ?? 0),
  };

  const nonce = generateUUID();

  const gasPrice = await GatewayClientRepository.getUserOperationGasPrice(oc);

  const chains = await getChains(oc);
  const currentChain = chains.find(
    (chain) => chain.caipId.toLowerCase() === data.caip2Id.toLowerCase(),
  );

  if (!currentChain) {
    throw new BaseError(`Chain Not Supported`, {
      details: `${data.caip2Id} is not supported for this client`,
    });
  }

  if (!currentChain.caipId.toLowerCase().startsWith('eip155:')) {
    throw new BaseError('Invalid Chain Type', {
      details: `${data.caip2Id} is not an EVM-compatible chain. EVM Raw Transactions can only be created for EVM chains.`,
    });
  }

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const requestBody: EvmRawTransactionEstimateRequest = {
    type: Constants.INTENT_TYPE.RAW_TRANSACTION,
    jobId: nonce,
    paymasterData,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    details: {
      caip2Id: data.caip2Id,
      transactions: [
        {
          data: transaction.data,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
        },
      ],
    },
    feePayerAddress,
  };

  // Get estimate from BFF API
  const evmRawTransactionEstimate =
    await BffClientRepository.getEvmRawTransactionEstimate(oc, requestBody);

  const details: EstimationDetails = {
    ...evmRawTransactionEstimate.details,
    gsn: evmRawTransactionEstimate.callData?.gsn
      ? {
          isPossible: evmRawTransactionEstimate.callData.gsn.isPossible,
          isRequired: evmRawTransactionEstimate.callData.gsn.isRequired,
          requiredNetworks: [
            ...evmRawTransactionEstimate.callData.gsn.requiredNetworks,
          ],
          tokens: [...evmRawTransactionEstimate.callData.gsn.tokens],
        }
      : undefined,
  };

  // Use the jobId and userSWA from the estimate response
  const jobId =
    evmRawTransactionEstimate.userOps.nonce ||
    toHex(nonceToBigInt(nonce), { size: 32 });
  const userSWA = evmRawTransactionEstimate.userOps.sender || oc.userSWA;

  const userOp: UserOp = {
    sender: userSWA,
    nonce: jobId,
    paymaster: oc.env.paymasterAddress,
    callGasLimit: evmRawTransactionEstimate.userOps.callGasLimit,
    verificationGasLimit:
      evmRawTransactionEstimate.userOps.verificationGasLimit,
    preVerificationGas: evmRawTransactionEstimate.userOps.preVerificationGas,
    maxFeePerGas:
      evmRawTransactionEstimate.userOps.maxFeePerGas || gasPrice.maxFeePerGas,
    maxPriorityFeePerGas:
      evmRawTransactionEstimate.userOps.maxPriorityFeePerGas ||
      gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit:
      evmRawTransactionEstimate.userOps.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit:
      evmRawTransactionEstimate.userOps.paymasterVerificationGasLimit,
    callData: evmRawTransactionEstimate.userOps.callData,
    paymasterData: evmRawTransactionEstimate.userOps.paymasterData,
  };

  return {
    userOp,
    details: details,
  };
}
