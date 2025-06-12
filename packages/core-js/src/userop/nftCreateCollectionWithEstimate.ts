import GatewayClientRepository from '@/api/gateway.js';
import type OktoClient from '@/core/index.js';
import { BaseError } from '@/errors/base.js';
import { getChains } from '@/explorer/chain.js';
import type { Address, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import { toHex } from 'viem';
import type { NftCreateCollectionParams } from './types.js';
import {
  NftCreateCollectionParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import BffClientRepository from '@/api/bff.js';
import type {
  EstimationDetails,
  NftCreateCollectionEstimateRequest,
} from '@/types/bff/estimate.js';

/**
 * Creates a user operation for NFT collection creation.
 *
 * This function initiates the process of creating an NFT collection by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for creating the NFT collection (caip2Id, name, uri, and optional data with attributes, symbol, type, description).
 * @param feePayerAddress - Optional fee payer address.
 * @returns The User Operation (UserOp) for the NFT collection creation and collection details.
 */
export async function nftCreateCollectionWithEstimate(
  oc: OktoClient,
  data: NftCreateCollectionParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: EstimationDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }
  validateSchema(NftCreateCollectionParamsSchema, data);

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

  if (!currentChain.caipId.toLowerCase().startsWith('aptos:')) {
    throw new BaseError(
      'NFT Collection creation is only supported on Aptos chain',
      {
        details: `Provided chain: ${currentChain.caipId}`,
      },
    );
  }

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  // Prepare and send estimation request
  const requestBody: NftCreateCollectionEstimateRequest = {
    type: Constants.INTENT_TYPE.NFT_CREATE_COLLECTION,
    jobId: nonce,
    paymasterData,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    feePayerAddress: feePayerAddress,
    details: data,
  };

  // Get estimate from BFF API
  const nftCollectionCreationEstimate =
    await BffClientRepository.getNftCreateCollectionEstimate(oc, requestBody);

  const details: EstimationDetails = {
    ...nftCollectionCreationEstimate.details,
    gsn: nftCollectionCreationEstimate.callData?.gsn
      ? {
          isPossible: nftCollectionCreationEstimate.callData.gsn.isPossible,
          isRequired: nftCollectionCreationEstimate.callData.gsn.isRequired,
          requiredNetworks: [
            ...nftCollectionCreationEstimate.callData.gsn.requiredNetworks,
          ],
          tokens: [...nftCollectionCreationEstimate.callData.gsn.tokens],
        }
      : undefined,
  };

  // Use the jobId and userSWA from the estimate response
  const jobId =
    nftCollectionCreationEstimate.userOps.nonce ||
    toHex(nonceToBigInt(nonce), { size: 32 });
  const userSWA = nftCollectionCreationEstimate.userOps.sender || oc.userSWA;

  const userOp: UserOp = {
    sender: userSWA,
    nonce: jobId,
    paymaster: oc.env.paymasterAddress,
    callGasLimit: nftCollectionCreationEstimate.userOps.callGasLimit,
    verificationGasLimit:
      nftCollectionCreationEstimate.userOps.verificationGasLimit,
    preVerificationGas:
      nftCollectionCreationEstimate.userOps.preVerificationGas,
    maxFeePerGas:
      nftCollectionCreationEstimate.userOps.maxFeePerGas ||
      gasPrice.maxFeePerGas,
    maxPriorityFeePerGas:
      nftCollectionCreationEstimate.userOps.maxPriorityFeePerGas ||
      gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit:
      nftCollectionCreationEstimate.userOps.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit:
      nftCollectionCreationEstimate.userOps.paymasterVerificationGasLimit,
    callData: nftCollectionCreationEstimate.userOps.callData,
    paymasterData: nftCollectionCreationEstimate.userOps.paymasterData,
  };

  return {
    userOp,
    details: details,
  };
}
