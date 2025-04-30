import GatewayClientRepository from '@/api/gateway.js';
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
  SwapDetails,
  TokenSwapIntentParams,
  SwapEstimateRequest,
} from '@/types/bff/swap.js';
import BffClientRepository from '@/api/bff.js';

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
): Promise<{ userOp: UserOp; details: SwapDetails }> {
  // Validate if user is logged in
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }

  // Set fee payer address to default if not provided
  if (!feePayerAddress) {
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
  }

  // Generate unique nonce for this operation
  const nonce = generateUUID();

  // Fetch current gas prices from Gateway Client
  const gasPrice = await GatewayClientRepository.getUserOperationGasPrice(oc);

  // Get chain information to validate the chain IDs
  const chains = await getChains(oc);
  const fromChain = chains.find(
    (chain) =>
      chain.caipId.toLowerCase() === data.fromChainCaip2Id.toLowerCase(),
  );
  const toChain = chains.find(
    (chain) => chain.caipId.toLowerCase() === data.toChainCaip2Id.toLowerCase(),
  );

  // Validate chains are supported
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

  // Generate paymaster data with validity window
  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  // Build the request body for swap estimate with proper type
  const requestBody: SwapEstimateRequest = {
    type: Constants.INTENT_TYPE.SWAP,
    jobId: nonce,
    paymasterData,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    details: {
      fromChainTokenAddress: data.fromChainTokenAddress || '',
      fromChainCaip2Id: data.fromChainCaip2Id,
      toChainTokenAddress: data.toChainTokenAddress || '',
      toChainCaip2Id: data.toChainCaip2Id,
      sameChainFee: data.sameChainFee || '0',
      sameChainFeeCollector: data.sameChainFeeCollector || '',
      crossChainFee: data.crossChainFee || '0',
      crossChainFeeCollector: data.crossChainFeeCollector || '',
      fromChainTokenAmount: data.fromChainTokenAmount,
      minToTokenAmount: data.minToTokenAmount || '0',
      slippage: data.slippage || '0.1',
      advancedSettings:
        typeof data.advancedSettings === 'string'
          ? JSON.parse(data.advancedSettings)
          : data.advancedSettings
            ? {}
            : data.advancedSettings || {},
    },
  };

  // Get estimate from BFF API
  const swapEstimate = await BffClientRepository.getSwapEstimate(
    oc,
    requestBody,
  );

  // Prepare job parameters for the swap intent
  const jobParametersAbiType =
    '(string routeId, string fromChainCaip2Id, uint fromChainTokenAmount, string toChainCaip2Id, string minToTokenAmount, string fromChainTokenAddress, string toChainTokenAddress, string slippage, string sameChainFee, string sameChainFeeCollector, string crossChainFee, string crossChainFeeCollector, bytes advancedSettings)';
  const gsnDataAbiType = `(bool isRequired, string[] requiredNetworks, ${jobParametersAbiType}[] tokens)`;

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
                gsnEnabled: fromChain.gsnEnabled ?? false,
                sponsorshipEnabled: fromChain.sponsorshipEnabled ?? false,
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
          encodeAbiParameters(parseAbiParameters(jobParametersAbiType), [
            {
              routeId: data.routeId || swapEstimate.details.estimation.routeId,
              fromChainCaip2Id: data.fromChainCaip2Id,
              fromChainTokenAmount: BigInt(data.fromChainTokenAmount),
              toChainCaip2Id: data.toChainCaip2Id,
              minToTokenAmount: data.minToTokenAmount || '',
              fromChainTokenAddress: data.fromChainTokenAddress || '',
              toChainTokenAddress: data.toChainTokenAddress || '',
              slippage:
                data.slippage ||
                swapEstimate.details.estimation.slippageUsed ||
                '0',
              sameChainFee: data.sameChainFee || '0',
              sameChainFeeCollector: data.sameChainFeeCollector || '0x0',
              crossChainFee: data.crossChainFee || '0',
              crossChainFeeCollector: data.crossChainFeeCollector || '0x0',
              advancedSettings:
                typeof data.advancedSettings === 'string'
                  ? toHex(data.advancedSettings)
                  : data.advancedSettings instanceof Uint8Array
                    ? toHex(data.advancedSettings)
                    : '0x',
            },
          ]),
          Constants.INTENT_TYPE.SWAP,
        ],
      }),
    ],
  );

  // Prioritize gas prices from swap estimate if available, otherwise use previously fetched values
  const finalGasPrice = swapEstimate.userOps
    ? {
        maxFeePerGas: swapEstimate.userOps.maxFeePerGas,
        maxPriorityFeePerGas: swapEstimate.userOps.maxPriorityFeePerGas,
      }
    : gasPrice;

  // Create the user operation
  const userOp: UserOp = {
    sender: oc.userSWA,
    nonce: toHex(nonceToBigInt(nonce), { size: 32 }),
    paymaster: oc.env.paymasterAddress,
    callGasLimit:
      swapEstimate.userOps?.callGasLimit ||
      toHex(Constants.GAS_LIMITS.CALL_GAS_LIMIT),
    verificationGasLimit:
      swapEstimate.userOps?.verificationGasLimit ||
      toHex(Constants.GAS_LIMITS.VERIFICATION_GAS_LIMIT),
    preVerificationGas:
      swapEstimate.userOps?.preVerificationGas ||
      toHex(Constants.GAS_LIMITS.PRE_VERIFICATION_GAS),
    maxFeePerGas: finalGasPrice.maxFeePerGas,
    maxPriorityFeePerGas: finalGasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit:
      swapEstimate.userOps?.paymasterPostOpGasLimit ||
      toHex(Constants.GAS_LIMITS.PAYMASTER_POST_OP_GAS_LIMIT),
    paymasterVerificationGasLimit:
      swapEstimate.userOps?.paymasterVerificationGasLimit ||
      toHex(Constants.GAS_LIMITS.PAYMASTER_VERIFICATION_GAS_LIMIT),
    callData: swapEstimate.userOps?.callData || calldata,
    paymasterData:
      swapEstimate.userOps?.paymasterData ||
      (await oc.paymasterData({
        nonce: nonce,
        validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
      })),
  };

  return {
    userOp,
    details: swapEstimate.details,
  };
}
