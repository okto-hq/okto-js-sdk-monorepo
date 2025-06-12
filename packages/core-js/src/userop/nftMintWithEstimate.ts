import GatewayClientRepository from '@/api/gateway.js';
import type OktoClient from '@/core/index.js';
import { BaseError } from '@/errors/base.js';
import { getChains } from '@/explorer/chain.js';
import type { Address, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import { toHex } from 'viem';
import type { NftMintParams } from './types.js';
import { NftMintParamsSchema, validateSchema } from './userOpInputValidator.js';
import BffClientRepository from '@/api/bff.js';
import type {
  EstimationDetails,
  NftMintEstimateRequest,
} from '@/types/bff/estimate.js';

/**
 * Creates a user operation for minting an NFT.
 *
 * This function initiates the process of minting an NFT by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for minting an NFT (caip2Id, nftName, optional collectionAddress, uri, and optional data).
 * @param feePayerAddress - Optional fee payer address.
 * @returns The User Operation (UserOp) for the NFT minting and mint details.
 */
export async function nftMintWithEstimate(
  oc: OktoClient,
  data: NftMintParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: EstimationDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }
  validateSchema(NftMintParamsSchema, data);

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
    throw new BaseError('NFT Minting is only supported on Aptos chain', {
      details: `Provided chain: ${currentChain.caipId}`,
    });
  }

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const requestBody: NftMintEstimateRequest = {
    type: Constants.INTENT_TYPE.NFT_MINT,
    jobId: nonce,
    paymasterData,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    feePayerAddress: feePayerAddress,
    details: {
      caip2Id: data.caip2Id,
      nftName: data.nftName,
      collectionAddress: data.collectionAddress,
      uri: data.uri,
      data: {
        recipientWalletAddress: data.data.recipientWalletAddress,
        description: data.data.description,
        properties: data.data.properties || [],
      },
    },
  };

  // Get estimate from BFF API
  const nftMintEstimate = await BffClientRepository.getNftMintEstimate(
    oc,
    requestBody,
  );

  const details: EstimationDetails = {
    ...nftMintEstimate.details,
    gsn: nftMintEstimate.callData?.gsn
      ? {
          isPossible: nftMintEstimate.callData.gsn.isPossible,
          isRequired: nftMintEstimate.callData.gsn.isRequired,
          requiredNetworks: [...nftMintEstimate.callData.gsn.requiredNetworks],
          tokens: [...nftMintEstimate.callData.gsn.tokens],
        }
      : undefined,
  };

  // Use the jobId and userSWA from the estimate response
  const jobId =
    nftMintEstimate.userOps.nonce || toHex(nonceToBigInt(nonce), { size: 32 });
  const userSWA = nftMintEstimate.userOps.sender || oc.userSWA;

  const userOp: UserOp = {
    sender: userSWA,
    nonce: jobId,
    paymaster: oc.env.paymasterAddress,
    callGasLimit: nftMintEstimate.userOps.callGasLimit,
    verificationGasLimit: nftMintEstimate.userOps.verificationGasLimit,
    preVerificationGas: nftMintEstimate.userOps.preVerificationGas,
    maxFeePerGas: nftMintEstimate.userOps.maxFeePerGas || gasPrice.maxFeePerGas,
    maxPriorityFeePerGas:
      nftMintEstimate.userOps.maxPriorityFeePerGas ||
      gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit: nftMintEstimate.userOps.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit:
      nftMintEstimate.userOps.paymasterVerificationGasLimit,
    callData: nftMintEstimate.userOps.callData,
    paymasterData: nftMintEstimate.userOps.paymasterData,
  };

  return {
    userOp,
    details: details,
  };
}
