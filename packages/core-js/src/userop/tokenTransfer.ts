import type OktoClient from '@/core/index.js';
import { BaseError } from '@/errors/base.js';
import { getChains } from '@/explorer/chain.js';
import type { UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import {
  encodeAbiParameters,
  encodeFunctionData,
  parseAbiParameters,
  toHex,
} from 'viem';
import { INTENT_ABI } from './abi.js';
import type { TokenTransferIntentParams } from './types.js';
import { TokenTransferIntentParamsSchema } from './userOpInputValidator.js';

/**
 * Creates a user operation for token transfer.
 *
 * This function initiates the process of transferring a token by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for transferring the token (caip2Id, recipientWalletAddress, tokenAddress, amount).
 * @returns The User Operation (UserOp) for the token transfer.
 */
export async function tokenTransfer(
  oc: OktoClient,
  data: TokenTransferIntentParams,
): Promise<UserOp> {
  if (!oc.isLoggedIn) {
    throw new BaseError('User not logged in');
  }
  TokenTransferIntentParamsSchema.parse(data);

  if (data.recipient === oc.userSWA) {
    throw new BaseError(
      'Recipient address cannot be the same as the user address',
    );
  }

  const nonce = generateUUID();

  const jobParametersAbiType =
    '(string caip2Id, string recipientWalletAddress, string tokenAddress, uint amount)';
  const gsnDataAbiType = `(bool isRequired, string[] requiredNetworks, ${jobParametersAbiType}[] tokens)`;

  const chains = await getChains(oc);
  const currentChain = chains.find(
    (chain) => chain.caip2Id.toLowerCase() === data.caip2Id.toLowerCase(),
  );

  if (!currentChain) {
    throw new BaseError(`Chain Not Supported`, {
      details: `${data.caip2Id} is not supported for this client`,
    });
  }

  const calldata = encodeAbiParameters(
    parseAbiParameters('bytes4, address, bytes'),
    [
      Constants.EXECUTE_USEROP_FUNCTION_SELECTOR,
      oc.env.jobManagerAddress,
      encodeFunctionData({
        abi: INTENT_ABI,
        functionName: 'initiateJob',
        args: [
          toHex(nonceToBigInt(nonce), { size: 32 }),
          oc.vendorSWA,
          oc.userSWA,
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
              recipientWalletAddress: data.recipient,
              tokenAddress: data.token,
            },
          ]),
          'TOKEN_TRANSFER',
        ],
      }),
    ],
  );

  const userOp: UserOp = {
    sender: oc.userSWA,
    nonce: toHex(nonceToBigInt(nonce), { size: 32 }),
    paymaster: oc.env.paymasterAddress,
    callGasLimit: toHex(BigInt(300_000)),
    verificationGasLimit: toHex(BigInt(200_000)),
    preVerificationGas: toHex(BigInt(50_000)),
    maxFeePerGas: toHex(BigInt(2000000000)),
    maxPriorityFeePerGas: toHex(BigInt(2000000000)),
    paymasterPostOpGasLimit: toHex(BigInt(100000)),
    paymasterVerificationGasLimit: toHex(BigInt(100000)),
    callData: calldata,
    paymasterData: await oc.paymasterData({
      nonce: nonce,
      validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
    }),
  };

  return userOp;
}
