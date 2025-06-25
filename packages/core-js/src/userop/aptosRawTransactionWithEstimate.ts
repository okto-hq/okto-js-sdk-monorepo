import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import { BaseError } from '@/errors/base.js';
import { getChains } from '@/explorer/chain.js';
import type { Address, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import { toHex } from 'viem';
import type { AptosRawTransactionIntentParams } from './types.js';
import {
  AptosRawTransactionIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import type {
  AptosRawTransactionEstimateRequest,
  EstimationDetails,
} from '@/types/bff/estimate.js';

/**
 * Creates a user operation for Aptos Raw Transaction.
 *
 * This function initiates the process of executing Aptos transactions by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for the Aptos raw transaction.
 * @param feePayerAddress - Optional fee payer address, defaults to Constants.FEE_PAYER_ADDRESS.
 * @returns The User Operation (UserOp) for the Aptos raw transaction and transaction details.
 */
export async function aptosRawTransactionWithEstimate(
  oc: OktoClient,
  data: AptosRawTransactionIntentParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: EstimationDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }
  validateSchema(AptosRawTransactionIntentParamsSchema, data);

  const nonce = generateUUID();

  const chains = await getChains(oc);
  const currentChain = chains.find(
    (chain) => chain.caipId.toLowerCase() === data.caip2Id.toLowerCase(),
  );

  if (!currentChain) {
    throw new BaseError(`Chain Not Supported`, {
      details: `${data.caip2Id} is not supported for this client`,
    });
  }

  if (!data.caip2Id.toLowerCase().startsWith('aptos:')) {
    throw new BaseError('Invalid chain for Aptos transaction', {
      details: `${data.caip2Id} is not an Aptos chain`,
    });
  }

  const gasPrice = await BffClientRepository.getUserOperationGasPrice(oc);

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const transactions = data.transactions.map((transaction) => ({
    function: transaction.function,
    typeArguments: transaction.typeArguments || [],
    functionArguments: transaction.functionArguments || [],
  }));

  const requestBody: AptosRawTransactionEstimateRequest = {
    type: Constants.INTENT_TYPE.RAW_TRANSACTION,
    jobId: nonce,
    paymasterData,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    details: {
      caip2Id: data.caip2Id,
      transactions: transactions,
    },
    feePayerAddress: feePayerAddress ?? '',
  };

  // Get estimate from BFF API
  const aptosRawTransactionEstimate =
    await BffClientRepository.getAptosRawTransactionEstimate(oc, requestBody);

  const details: EstimationDetails = {
    ...aptosRawTransactionEstimate.details,
    gsn: aptosRawTransactionEstimate.callData?.gsn
      ? {
          isPossible: aptosRawTransactionEstimate.callData.gsn.isPossible,
          isRequired: aptosRawTransactionEstimate.callData.gsn.isRequired,
          requiredNetworks: [
            ...aptosRawTransactionEstimate.callData.gsn.requiredNetworks,
          ],
          tokens: [...aptosRawTransactionEstimate.callData.gsn.tokens],
        }
      : undefined,
  };

  // Use the jobId and userSWA from the estimate response
  const jobId =
    aptosRawTransactionEstimate.userOps.nonce ||
    toHex(nonceToBigInt(nonce), { size: 32 });
  const userSWA = aptosRawTransactionEstimate.userOps.sender || oc.userSWA;

  const userOp: UserOp = {
    sender: userSWA,
    nonce: jobId,
    paymaster: oc.env.paymasterAddress,
    callGasLimit: aptosRawTransactionEstimate.userOps.callGasLimit,
    verificationGasLimit:
      aptosRawTransactionEstimate.userOps.verificationGasLimit,
    preVerificationGas: aptosRawTransactionEstimate.userOps.preVerificationGas,
    maxFeePerGas:
      aptosRawTransactionEstimate.userOps.maxFeePerGas || gasPrice.maxFeePerGas,
    maxPriorityFeePerGas:
      aptosRawTransactionEstimate.userOps.maxPriorityFeePerGas ||
      gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit:
      aptosRawTransactionEstimate.userOps.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit:
      aptosRawTransactionEstimate.userOps.paymasterVerificationGasLimit,
    callData: aptosRawTransactionEstimate.userOps.callData,
    paymasterData: aptosRawTransactionEstimate.userOps.paymasterData,
  };

  return {
    userOp,
    details: details,
  };
}
