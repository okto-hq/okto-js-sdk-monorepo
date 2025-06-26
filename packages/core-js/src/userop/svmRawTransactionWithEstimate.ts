import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import { BaseError } from '@/errors/base.js';
import { getChains } from '@/explorer/chain.js';
import type { Address, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import { toHex } from 'viem';
import type { SolanaRawTransactionIntentParams } from './types.js';
import {
  SolanaRawTransactionIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import type {
  SolanaRawTransactionEstimateRequest,
  EstimationDetails,
} from '@/types/bff/estimate.js';

/**
 * Creates a user operation for Solana Raw Transaction with gas estimation.
 *
 * This function initiates the process of executing Solana transactions by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution with gas estimation.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for the Solana raw transaction.
 * @param feePayerAddress - The fee payer address for SVM gas fees.
 * @returns The User Operation (UserOp) for the Solana raw transaction and estimation details.
 */
export async function svmRawTransactionWithEstimate(
  oc: OktoClient,
  data: SolanaRawTransactionIntentParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: EstimationDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }

  validateSchema(SolanaRawTransactionIntentParamsSchema, data);

  // if (!feePayerAddress) {
  //   throw new BaseError('Fee payer address is required for Solana transactions');
  // }

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

  if (!data.caip2Id.toLowerCase().startsWith('solana:')) {
    throw new BaseError('Invalid chain for Solana transaction', {
      details: `${data.caip2Id} is not a Solana chain`,
    });
  }

  const gasPrice = await BffClientRepository.getUserOperationGasPrice(oc);

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const transactions = data.transactions.map((transaction) => ({
    instructions: transaction.instructions,
    signers: transaction.signers,
  }));

  const requestBody: SolanaRawTransactionEstimateRequest = {
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
    feePayerAddress: feePayerAddress,
  };

  const svmRawTransactionEstimate =
    await BffClientRepository.getSvmRawTransactionEstimate(oc, requestBody);

  const details: EstimationDetails = {
    ...svmRawTransactionEstimate.details,
    gsn: svmRawTransactionEstimate.callData?.gsn
      ? {
          isPossible: svmRawTransactionEstimate.callData.gsn.isPossible,
          isRequired: svmRawTransactionEstimate.callData.gsn.isRequired,
          requiredNetworks: [
            ...svmRawTransactionEstimate.callData.gsn.requiredNetworks,
          ],
          tokens: [...svmRawTransactionEstimate.callData.gsn.tokens],
        }
      : undefined,
  };

  const jobId =
    svmRawTransactionEstimate.userOps.nonce ||
    toHex(nonceToBigInt(nonce), { size: 32 });

  const userSWA = svmRawTransactionEstimate.userOps.sender || oc.userSWA;

  const userOp: UserOp = {
    sender: userSWA,
    nonce: jobId,
    paymaster: oc.env.paymasterAddress,
    callGasLimit: svmRawTransactionEstimate.userOps.callGasLimit,
    verificationGasLimit:
      svmRawTransactionEstimate.userOps.verificationGasLimit,
    preVerificationGas: svmRawTransactionEstimate.userOps.preVerificationGas,
    maxFeePerGas:
      svmRawTransactionEstimate.userOps.maxFeePerGas || gasPrice.maxFeePerGas,
    maxPriorityFeePerGas:
      svmRawTransactionEstimate.userOps.maxPriorityFeePerGas ||
      gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit:
      svmRawTransactionEstimate.userOps.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit:
      svmRawTransactionEstimate.userOps.paymasterVerificationGasLimit,
    callData: svmRawTransactionEstimate.userOps.callData,
    paymasterData: svmRawTransactionEstimate.userOps.paymasterData,
  };

  return {
    userOp,
    details: details,
  };
}
