import GatewayClientRepository from '@/api/gateway.js';
import type OktoClient from '@/core/index.js';
import { BaseError } from '@/errors/base.js';
import { getChains } from '@/explorer/chain.js';
import type { Address, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import { toHex } from 'viem';
import BffClientRepository from '@/api/bff.js';
import {
  TokenTransferIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import type { TokenTransferIntentParams } from './types.js';
import type {
  EstimationDetails,
  TokenTransferEstimateRequest,
} from '@/types/bff/estimate.js';

/**
 * Creates a user operation for token transfer.
 *
 * This function initiates the process of transferring tokens by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for transferring tokens.
 * @param feePayerAddress - Optional fee payer address, defaults to Constants.FEE_PAYER_ADDRESS.
 * @returns The User Operation (UserOp) for the token transfer and transfer details.
 */
export async function tokenTransferWithEstimate(
  oc: OktoClient,
  data: TokenTransferIntentParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: EstimationDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }

  validateSchema(TokenTransferIntentParamsSchema, data);

  if (data.recipient === oc.userSWA) {
    throw new BaseError('Recipient address cannot be same as the user address');
  }

  const nonce = generateUUID();

  const gasPrice = await GatewayClientRepository.getUserOperationGasPrice(oc);

  const chains = await getChains(oc);
  const chain = chains.find(
    (chain) => chain.caipId.toLowerCase() === data.caip2Id.toLowerCase(),
  );

  if (!chain) {
    throw new BaseError(`Chain Not Supported`, {
      details: `${data.caip2Id} is not supported for this client`,
    });
  }

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const requestBody: TokenTransferEstimateRequest = {
    type: Constants.INTENT_TYPE.TOKEN_TRANSFER,
    jobId: nonce,
    paymasterData,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    feePayerAddress: feePayerAddress,
    details: {
      recipientWalletAddress: data.recipient,
      caip2Id: data.caip2Id,
      tokenAddress: data.token,
      amount: data.amount.toString(),
    },
  };

  // Get estimate from BFF API
  const tokenTransferEstimate =
    await BffClientRepository.getTokenTransferEstimate(oc, requestBody);

  const details: EstimationDetails = {
    ...tokenTransferEstimate.details,
    gsn: tokenTransferEstimate.callData?.gsn
      ? {
          isPossible: tokenTransferEstimate.callData.gsn.isPossible,
          isRequired: tokenTransferEstimate.callData.gsn.isRequired,
          requiredNetworks: [
            ...tokenTransferEstimate.callData.gsn.requiredNetworks,
          ],
          tokens: [...tokenTransferEstimate.callData.gsn.tokens],
        }
      : undefined,
  };

  // Use the jobId and userSWA from the estimate response
  const jobId =
    tokenTransferEstimate.userOps.nonce ||
    toHex(nonceToBigInt(nonce), { size: 32 });

  const userSWA = tokenTransferEstimate.userOps.sender || oc.userSWA;

  const userOp: UserOp = {
    sender: userSWA,
    nonce: jobId,
    paymaster: oc.env.paymasterAddress,
    callGasLimit: tokenTransferEstimate.userOps.callGasLimit,
    verificationGasLimit: tokenTransferEstimate.userOps.verificationGasLimit,
    preVerificationGas: tokenTransferEstimate.userOps.preVerificationGas,
    maxFeePerGas:
      tokenTransferEstimate.userOps.maxFeePerGas || gasPrice.maxFeePerGas,
    maxPriorityFeePerGas:
      tokenTransferEstimate.userOps.maxPriorityFeePerGas ||
      gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit:
      tokenTransferEstimate.userOps.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit:
      tokenTransferEstimate.userOps.paymasterVerificationGasLimit,
    callData: tokenTransferEstimate.userOps.callData,
    paymasterData: tokenTransferEstimate.userOps.paymasterData,
  };

  return {
    userOp,
    details: details,
  };
}
