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
import type { NftCreateCollectionParams } from './types.js';
import {
  NftCreateCollectionParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import BffClientRepository from '@/api/bff.js';

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
 * @returns The User Operation (UserOp) for the NFT collection creation.
 */
export async function nftCreateCollection(
  oc: OktoClient,
  data: NftCreateCollectionParams,
  feePayerAddress?: Address,
): Promise<UserOp> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }
  validateSchema(NftCreateCollectionParamsSchema, data);

  const nonce = generateUUID();

  if (!feePayerAddress) {
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
  }

  const jobParametersAbiType =
    '(string caip2Id, string name, string uri, bytes data)';
  const gsnDataAbiType = `(bool isRequired, string[] requiredNetworks, ${jobParametersAbiType}[] tokens)`;

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

  const nftData = JSON.stringify({
    type: data.data.type || '',
    attributes: data.data.attributes || '',
    description: data.data.description || '',
    symbol: data.data.symbol || '',
  });

  const nftDataEncoded = toHex(new TextEncoder().encode(nftData));

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
              name: data.name,
              uri: data.uri,
              data: nftDataEncoded,
            },
          ]),
          Constants.INTENT_TYPE.NFT_CREATE_COLLECTION,
        ],
      }),
    ],
  );

  const gasPrice = await GatewayClientRepository.getUserOperationGasPrice(oc);

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const gasEstimation = await BffClientRepository.estimateUserOp(oc, {
    sender: oc.userSWA,
    nonce: toHex(nonceToBigInt(nonce), { size: 32 }),
    callData: calldata,
    maxFeePerGas: gasPrice.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    paymasterData: paymasterData,
    paymaster: oc.env.paymasterAddress,
  });

  const userOp: UserOp = {
    sender: oc.userSWA,
    nonce: toHex(nonceToBigInt(nonce), { size: 32 }),
    paymaster: oc.env.paymasterAddress,
    callGasLimit: gasEstimation.callGasLimit,
    verificationGasLimit: gasEstimation.verificationGasLimit,
    preVerificationGas: gasEstimation.preVerificationGas,
    maxFeePerGas: gasEstimation.maxFeePerGas,
    maxPriorityFeePerGas: gasEstimation.maxPriorityFeePerGas,
    paymasterPostOpGasLimit: gasEstimation.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit: gasEstimation.paymasterVerificationGasLimit,
    callData: calldata,
    paymasterData: paymasterData,
  };

  return userOp;
}
