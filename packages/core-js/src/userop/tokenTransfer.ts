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
import type { TokenTransferIntentParams } from './types.js';
import {
  TokenTransferIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';

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
// TODO: Implement a destructured param instead before V1 release
export async function tokenTransfer(
  oc: OktoClient,
  data: TokenTransferIntentParams,
  feePayerAddress?: Address,
): Promise<UserOp> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }
  validateSchema(TokenTransferIntentParamsSchema, data);

  if (data.recipient === oc.userSWA) {
    throw new BaseError('Recipient address cannot be same as the user address');
  }

  console.log('KARAN :: feePayerAddress1 ', feePayerAddress);

  if (!feePayerAddress) {
    console.log('KARAN :: feePayerAddress not provided ');
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
    console.log('KARAN :: feePayerAddress set to default', feePayerAddress);
  }

  console.log('KARAN :: feePayerAddress2', feePayerAddress);

  const nonce = generateUUID();

  const jobParametersAbiType =
    '(string caip2Id, string recipientWalletAddress, string tokenAddress, uint amount)';
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

  const calldata = encodeAbiParameters(
    parseAbiParameters('bytes4, address,uint256, bytes'),
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
              recipientWalletAddress: data.recipient,
              tokenAddress: data.token,
            },
          ]),
          Constants.INTENT_TYPE.TOKEN_TRANSFER,
        ],
      }),
    ],
  );

  const gasPrice = await GatewayClientRepository.getUserOperationGasPrice(oc);

  const userOp: UserOp = {
    sender: oc.userSWA,
    nonce: toHex(nonceToBigInt(nonce), { size: 32 }),
    paymaster: oc.env.paymasterAddress,
    callGasLimit: toHex(Constants.GAS_LIMITS.CALL_GAS_LIMIT),
    verificationGasLimit: toHex(Constants.GAS_LIMITS.VERIFICATION_GAS_LIMIT),
    preVerificationGas: toHex(Constants.GAS_LIMITS.PRE_VERIFICATION_GAS),
    maxFeePerGas: gasPrice.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit: toHex(
      Constants.GAS_LIMITS.PAYMASTER_POST_OP_GAS_LIMIT,
    ),
    paymasterVerificationGasLimit: toHex(
      Constants.GAS_LIMITS.PAYMASTER_VERIFICATION_GAS_LIMIT,
    ),
    callData: calldata,
    paymasterData: await oc.paymasterData({
      nonce: nonce,
      validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
    }),
  };

  return userOp;
}
