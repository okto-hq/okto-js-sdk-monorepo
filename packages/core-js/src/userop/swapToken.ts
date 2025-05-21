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
  TokenSwapIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import type {
  EstimationDetails,
  SwapEstimateRequest,
  TokenSwapIntentParams,
} from '@/types/index.js';

/**
 * Creates a user operation for token swap.
 *
 * This function initiates the process of swapping tokens by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for swapping tokens.
 * @param feePayerAddress - Optional fee payer address, defaults to Constants.FEE_PAYER_ADDRESS.
 * @returns The User Operation (UserOp) for the token swap and swap details.
 */
export async function swapToken(
  oc: OktoClient,
  data: TokenSwapIntentParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: EstimationDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }

  validateSchema(TokenSwapIntentParamsSchema, data);

  if (!feePayerAddress) {
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
  }

  const nonce = generateUUID();

  const gasPrice = await GatewayClientRepository.getUserOperationGasPrice(oc);

  const chains = await getChains(oc);
  const fromChain = chains.find(
    (chain) =>
      chain.caipId.toLowerCase() === data.fromChainCaip2Id.toLowerCase(),
  );
  const toChain = chains.find(
    (chain) => chain.caipId.toLowerCase() === data.toChainCaip2Id.toLowerCase(),
  );

  if (!fromChain) {
    throw new BaseError(`Chain Not Supported`, {
      details: `${data.fromChainCaip2Id} is not supported for this client`,
    });
  }

  if (!toChain) {
    throw new BaseError(`Chain Not Supported`, {
      details: `${data.toChainCaip2Id} is not supported for this client`,
    });
  }

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const requestBody: SwapEstimateRequest = {
    type: Constants.INTENT_TYPE.SWAP,
    jobId: nonce,
    paymasterData,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    details: {
      fromChainTokenAddress: data.fromChainTokenAddress,
      fromChainCaip2Id: data.fromChainCaip2Id,
      toChainTokenAddress: data.toChainTokenAddress,
      toChainCaip2Id: data.toChainCaip2Id,
      sameChainFee: data.sameChainFee,
      sameChainFeeCollector: data.sameChainFeeCollector,
      crossChainFee: data.crossChainFee,
      crossChainFeeCollector: data.crossChainFeeCollector,
      fromChainTokenAmount: data.fromChainTokenAmount,
      minToTokenAmount: data.minToTokenAmount,
      slippage: data.slippage,
      advancedSettings: data.advancedSettings || {},
    },
  };

  // Get estimate from BFF API
  const swapEstimate = await BffClientRepository.getSwapEstimate(
    oc,
    requestBody,
  );

  const details: EstimationDetails = {
    ...swapEstimate.details,
    gsn: swapEstimate.callData?.gsn
      ? {
          isPossible: swapEstimate.callData.gsn.isPossible,
          isRequired: swapEstimate.callData.gsn.isRequired,
          requiredNetworks: [...swapEstimate.callData.gsn.requiredNetworks],
          tokens: [...swapEstimate.callData.gsn.tokens],
        }
      : undefined,
  };

  const jobId =
    swapEstimate.userOps.nonce || toHex(nonceToBigInt(nonce), { size: 32 });
  const userSWA = swapEstimate.userOps.sender || oc.userSWA;

  const userOp: UserOp = {
    sender: userSWA,
    nonce: jobId,
    paymaster: oc.env.paymasterAddress,
    callGasLimit: swapEstimate.userOps.callGasLimit,
    verificationGasLimit: swapEstimate.userOps.verificationGasLimit,
    preVerificationGas: swapEstimate.userOps.preVerificationGas,
    maxFeePerGas: swapEstimate.userOps.maxFeePerGas || gasPrice.maxFeePerGas,
    maxPriorityFeePerGas:
      swapEstimate.userOps.maxPriorityFeePerGas ||
      gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit: swapEstimate.userOps.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit:
      swapEstimate.userOps.paymasterVerificationGasLimit,
    callData: swapEstimate.userOps.callData,
    paymasterData: swapEstimate.userOps.paymasterData,
  };

  return {
    userOp,
    details: details,
  };
}
