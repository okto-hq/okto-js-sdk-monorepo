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
  stringToBytes,
  toHex,
} from 'viem';
import { INTENT_ABI } from './abi.js';
import type {
  AptosRawTransaction,
  AptosRawTransactionIntentParams,
} from './types.js';
import {
  AptosRawTransactionIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import BffClientRepository from '@/api/bff.js';

/**
 * Creates a user operation for Aptos Raw Transaction.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for the Aptos raw transaction.
 * @returns The User Operation (UserOp) for the Aptos raw transaction.
 */
export async function aptosRawTransaction(
  oc: OktoClient,
  data: AptosRawTransactionIntentParams,
  feePayerAddress?: Address,
): Promise<UserOp> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }
  validateSchema(AptosRawTransactionIntentParamsSchema, data);

  if (!feePayerAddress) {
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
  }

  const nonce = generateUUID();

  const jobParametersAbiType = '(string caip2Id, bytes[] transactions)';
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

  if (!data.caip2Id.toLowerCase().startsWith('aptos:')) {
    throw new BaseError('Invalid chain for Aptos transaction', {
      details: `${data.caip2Id} is not an Aptos chain`,
    });
  }

  const transactionsBytes = data.transactions.map((transaction) => {
    const aptosTransaction: AptosRawTransaction = {
      function: transaction.function,
      typeArguments: transaction.typeArguments || [],
      functionArguments: transaction.functionArguments || [],
    };
    return toHex(stringToBytes(JSON.stringify(aptosTransaction)));
  });

  const jobparam = encodeAbiParameters(
    parseAbiParameters(jobParametersAbiType),
    [
      {
        caip2Id: data.caip2Id,
        transactions: transactionsBytes,
      },
    ],
  );

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
          jobparam,
          Constants.INTENT_TYPE.RAW_TRANSACTION,
        ],
      }),
    ],
  );

  const gasPrice = await BffClientRepository.getUserOperationGasPrice(oc);

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
