import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import { getChains } from '@/explorer/chain.js';
import type { Address, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import {
  BaseError,
  encodeAbiParameters,
  encodeFunctionData,
  parseAbiParameters,
  toHex,
} from 'viem';
import { INTENT_ABI } from './abi.js';
import type { NFTTransferIntentParams } from './types.js';
import {
  NFTTransferIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';

/**
 * Creates a user operation for NFT transfer.
 *
 * This function initiates the process of transferring an NFT by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param data - The parameters for transferring the NFT (caip2Id, collectionAddress, nftId, recipientWalletAddress, amount, type).
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @returns The User Operation (UserOp) for the NFT transfer.
 */

export async function nftTransfer(
  oc: OktoClient,
  data: NFTTransferIntentParams,
  feePayerAddress?: Address,
): Promise<UserOp> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }

  validateSchema(NFTTransferIntentParamsSchema as any, data);

  if (data.recipientWalletAddress === oc.userSWA) {
    throw new BaseError(
      'Recipient wallet address cannot be same as the user address',
    );
  }

  if (!feePayerAddress) {
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
  }

  const nonce = generateUUID();
  const jobParametersAbiType =
    '(string caip2Id, string nftId, string recipientWalletAddress, string collectionAddress, string nftType, uint amount)';
  const gsnDataAbiType = `(bool isRequired, string[] requiredNetworks, ${jobParametersAbiType}[] tokens)`;

  const chains = await getChains(oc);
  const currentChain = chains.find((chain) => chain.caipId === data.caip2Id);

  if (!currentChain) {
    throw new BaseError(`Chain Not Supported`, {
      details: `${data.caip2Id} is not supported for this client`,
    });
  }

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
              amount: BigInt(data.amount),
              caip2Id: data.caip2Id,
              recipientWalletAddress: data.recipientWalletAddress,
              nftId: data.nftId,
              collectionAddress: data.collectionAddress,
              nftType: data.nftType,
            },
          ]),
          Constants.INTENT_TYPE.NFT_TRANSFER,
        ],
      }),
    ],
  );

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const gasEstimation = await BffClientRepository.estimateGasLimits(oc, {
    sender: oc.userSWA,
    nonce: toHex(nonceToBigInt(nonce), { size: 32 }),
    callData: calldata,
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
