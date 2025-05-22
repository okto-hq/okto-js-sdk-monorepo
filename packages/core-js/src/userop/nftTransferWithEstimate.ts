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
  NFTTransferIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import type { NFTTransferIntentParams } from './types.js';
import type {
  EstimationDetails,
  NFTTransferEstimateRequest,
} from '@/types/bff/estimate.js';

/**
 * Creates a user operation for NFT transfer.
 *
 * This function initiates the process of transferring an NFT by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for NFT transfer.
 * @param feePayerAddress - Optional fee payer address, defaults to Constants.FEE_PAYER_ADDRESS.
 * @returns The User Operation (UserOp) for the NFT transfer and transfer details.
 */
export async function nftTransferWithEstimate(
  oc: OktoClient,
  data: NFTTransferIntentParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: EstimationDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }

  validateSchema(NFTTransferIntentParamsSchema, data);

  const nonce = generateUUID();

  if (!feePayerAddress) {
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
  }

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

  const requestBody: NFTTransferEstimateRequest = {
    type: Constants.INTENT_TYPE.NFT_TRANSFER,
    jobId: nonce,
    paymasterData,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    feePayerAddress,
    details: {
      caip2Id: data.caip2Id,
      collectionAddress: data.collectionAddress || '',
      nftId: data.nftId || '',
      recipientWalletAddress: data.recipientWalletAddress,
      amount: data.amount.toString() || '1',
      nftType: data.nftType || '',
    },
  };

  // Get estimate from BFF API
  const nftTransferEstimate = await BffClientRepository.getNFTTransferEstimate(
    oc,
    requestBody,
  );

  const details: EstimationDetails = {
    ...nftTransferEstimate.details,
    gsn: nftTransferEstimate.callData?.gsn
      ? {
          isPossible: nftTransferEstimate.callData.gsn.isPossible,
          isRequired: nftTransferEstimate.callData.gsn.isRequired,
          requiredNetworks: [
            ...nftTransferEstimate.callData.gsn.requiredNetworks,
          ],
          tokens: [...nftTransferEstimate.callData.gsn.tokens],
        }
      : undefined,
  };

  // Use the jobId and userSWA from the estimate response
  const jobId =
    nftTransferEstimate.userOps.nonce ||
    toHex(nonceToBigInt(nonce), { size: 32 });
  const userSWA = nftTransferEstimate.userOps.sender || oc.userSWA;

  const userOp: UserOp = {
    sender: userSWA,
    nonce: jobId,
    paymaster: oc.env.paymasterAddress,
    callGasLimit: nftTransferEstimate.userOps.callGasLimit,
    verificationGasLimit: nftTransferEstimate.userOps.verificationGasLimit,
    preVerificationGas: nftTransferEstimate.userOps.preVerificationGas,
    maxFeePerGas:
      nftTransferEstimate.userOps.maxFeePerGas || gasPrice.maxFeePerGas,
    maxPriorityFeePerGas:
      nftTransferEstimate.userOps.maxPriorityFeePerGas ||
      gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit:
      nftTransferEstimate.userOps.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit:
      nftTransferEstimate.userOps.paymasterVerificationGasLimit,
    callData: nftTransferEstimate.userOps.callData,
    paymasterData: nftTransferEstimate.userOps.paymasterData,
  };

  return {
    userOp,
    details: details,
  };
}
