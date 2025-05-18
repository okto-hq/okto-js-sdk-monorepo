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
import type { NftMintParams } from './types.js';
import { NftMintParamsSchema, validateSchema } from './userOpInputValidator.js';
import BffClientRepository from '@/api/bff.js';
import type {
  NftMintEstimateDetails,
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
export async function estimateNftMint(
  oc: OktoClient,
  data: NftMintParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: NftMintEstimateDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }

  validateSchema(NftMintParamsSchema, data);

  const nonce = generateUUID();

  if (!feePayerAddress) {
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
  }

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

  const properties = data.data.properties || [];

  const formattedProperties = properties.map((prop) => ({
    name: prop.name,
    valueType: String(prop.type),
    value: prop.value,
  }));

  const nftData = JSON.stringify({
    recipientWalletAddress: data.data.recipientWalletAddress || '',
    description: data.data.description || '',
    properties: formattedProperties,
  });

  const nftDataEncoded = toHex(new TextEncoder().encode(nftData));

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const requestBody: NftMintEstimateRequest = {
    type: Constants.INTENT_TYPE.NFT_MINT,
    jobId: nonce,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    feePayerAddress: feePayerAddress,
    paymasterData,
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

  const jobParametersAbiType =
    '(string caip2Id, string nftName, string collectionAddress, string uri, bytes data)';
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
          encodeAbiParameters(parseAbiParameters(jobParametersAbiType), [
            {
              caip2Id: data.caip2Id,
              nftName: data.nftName,
              collectionAddress: data.collectionAddress || '',
              uri: data.uri,
              data: nftDataEncoded,
            },
          ]),
          Constants.INTENT_TYPE.NFT_MINT,
        ],
      }),
    ],
  );

  const userOp: UserOp = {
    sender: oc.userSWA,
    nonce: toHex(nonceToBigInt(nonce), { size: 32 }),
    paymaster: oc.env.paymasterAddress,
    callGasLimit:
      nftMintEstimate.userOps.callGasLimit ||
      toHex(Constants.GAS_LIMITS.CALL_GAS_LIMIT),
    verificationGasLimit:
      nftMintEstimate.userOps.verificationGasLimit ||
      toHex(Constants.GAS_LIMITS.VERIFICATION_GAS_LIMIT),
    preVerificationGas:
      nftMintEstimate.userOps.preVerificationGas ||
      toHex(Constants.GAS_LIMITS.PRE_VERIFICATION_GAS),
    maxFeePerGas: gasPrice.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit:
      nftMintEstimate.userOps.paymasterPostOpGasLimit ||
      toHex(Constants.GAS_LIMITS.PAYMASTER_POST_OP_GAS_LIMIT),
    paymasterVerificationGasLimit:
      nftMintEstimate.userOps.paymasterVerificationGasLimit ||
      toHex(Constants.GAS_LIMITS.PAYMASTER_VERIFICATION_GAS_LIMIT),
    callData: nftMintEstimate.userOps.callData || calldata,
    paymasterData: nftMintEstimate.userOps.paymasterData || paymasterData,
  };

  return {
    userOp,
    details: nftMintEstimate.details,
  };
}
