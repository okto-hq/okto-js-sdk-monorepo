import GatewayClientRepository from '@/api/gateway.js';
import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import { BaseError } from '@/errors/base.js';
import { getChains } from '@/explorer/chain.js';
import type { Address, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import {
  encodeAbiParameters,
  encodeFunctionData,
  numberToHex,
  parseAbiParameters,
  stringToBytes,
  toHex,
} from 'viem';
import { INTENT_ABI } from './abi.js';
import type {
  EVMRawTransaction,
  EVMRawTransactionIntentParams,
} from './types.js';
import {
  EvmRawTransactionIntentParamsSchema,
  validateSchema,
} from './userOpInputValidator.js';
import type {
  EvmRawTransactionEstimateRequest,
  EstimationDetails,
} from '@/types/bff/estimate.js';

/**
 * Creates a user operation for EVM raw transaction with estimation.
 *
 * This function initiates the process of executing raw EVM transactions by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for the raw transaction.
 * @param feePayerAddress - Optional fee payer address, defaults to Constants.FEE_PAYER_ADDRESS.
 * @returns The User Operation (UserOp) for the transaction and transfer details.
 */
export async function evmRawTransactionWithEstimate(
  oc: OktoClient,
  data: EVMRawTransactionIntentParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: EstimationDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }

  validateSchema(EvmRawTransactionIntentParamsSchema, data);

  if (!feePayerAddress) {
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
  }

  const transaction: EVMRawTransaction = {
    from: data.transaction.from,
    to: data.transaction.to,
    data: data.transaction.data ?? '0x',
    value: numberToHex(data.transaction.value ?? 0),
  };

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

  if (!currentChain.caipId.toLowerCase().startsWith('eip155:')) {
    throw new BaseError('Invalid Chain Type', {
      details: `${data.caip2Id} is not an EVM-compatible chain. EVM Raw Transactions can only be created for EVM chains.`,
    });
  }

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const requestBody: EvmRawTransactionEstimateRequest = {
    type: Constants.INTENT_TYPE.RAW_TRANSACTION,
    jobId: nonce,
    paymasterData,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    details: {
      caip2Id: data.caip2Id,
      transactions: [
        {
          data: transaction.data,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
        },
      ],
    },
    feePayerAddress,
  };

  // Get estimate from BFF API
  const transactionEstimate =
    await BffClientRepository.getEvmRawTransactionEstimate(oc, requestBody);

  const jobParametersAbiType = '(string caip2Id, bytes[] transactions)';
  const gsnDataAbiType = `(bool isRequired, string[] requiredNetworks, ${jobParametersAbiType}[] tokens)`;

  const jobparam = encodeAbiParameters(
    parseAbiParameters(jobParametersAbiType),
    [
      {
        caip2Id: data.caip2Id,
        transactions: [toHex(stringToBytes(JSON.stringify(transaction)))],
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

  const userOp: UserOp = {
    sender: oc.userSWA,
    nonce: toHex(nonceToBigInt(nonce), { size: 32 }),
    paymaster: oc.env.paymasterAddress,
    callGasLimit:
      transactionEstimate.userOps.callGasLimit ||
      toHex(Constants.GAS_LIMITS.CALL_GAS_LIMIT),
    verificationGasLimit:
      transactionEstimate.userOps.verificationGasLimit ||
      toHex(Constants.GAS_LIMITS.VERIFICATION_GAS_LIMIT),
    preVerificationGas:
      transactionEstimate.userOps.preVerificationGas ||
      toHex(Constants.GAS_LIMITS.PRE_VERIFICATION_GAS),
    maxFeePerGas: gasPrice.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit:
      transactionEstimate.userOps.paymasterPostOpGasLimit ||
      toHex(Constants.GAS_LIMITS.PAYMASTER_POST_OP_GAS_LIMIT),
    paymasterVerificationGasLimit:
      transactionEstimate.userOps.paymasterVerificationGasLimit ||
      toHex(Constants.GAS_LIMITS.PAYMASTER_VERIFICATION_GAS_LIMIT),
    callData: transactionEstimate.userOps.callData || calldata,
    paymasterData: transactionEstimate.userOps.paymasterData || paymasterData,
  };

  return {
    userOp,
    details: transactionEstimate.details,
  };
}
