import BffClientRepository from '@/api/bff.js';
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
import type {
  AptosRawTransactionEstimateRequest,
  RawTransactionEstimateDetails,
} from '@/types/bff/estimate.js';

/**
 * Creates a user operation for Aptos Raw Transaction.
 *
 * This function initiates the process of executing Aptos transactions by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for the Aptos raw transaction.
 * @param feePayerAddress - Optional fee payer address, defaults to Constants.FEE_PAYER_ADDRESS.
 * @returns The User Operation (UserOp) for the Aptos raw transaction and transaction details.
 */
export async function estimateAptosRawTransaction(
  oc: OktoClient,
  data: AptosRawTransactionIntentParams,
  feePayerAddress?: Address,
): Promise<{ userOp: UserOp; details: RawTransactionEstimateDetails }> {
  if (!oc.isLoggedIn()) {
    throw new BaseError('User not logged in');
  }
  validateSchema(AptosRawTransactionIntentParamsSchema, data);

  if (!feePayerAddress) {
    feePayerAddress = Constants.FEE_PAYER_ADDRESS;
  }

  const nonce = generateUUID();

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

  const gasPrice = await GatewayClientRepository.getUserOperationGasPrice(oc);

  const paymasterData = await oc.paymasterData({
    nonce: nonce,
    validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
  });

  const transactions = data.transactions.map((transaction) => ({
    transactionData: {
      function: transaction.function,
      typeArguments: transaction.typeArguments || [],
      functionArguments: transaction.functionArguments || [],
    },
  }));

  const requestBody: AptosRawTransactionEstimateRequest = {
    type: Constants.INTENT_TYPE.RAW_TRANSACTION,
    jobId: nonce,
    paymasterData,
    gasDetails: {
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    },
    details: {
      caip2Id: data.caip2Id,
      transactions: transactions,
    },
    feePayerAddress,
  };

  // Get estimate from BFF API
  const estimateResponse =
    await BffClientRepository.getAptosRawTransactionEstimate(oc, requestBody);

  const jobParametersAbiType = '(string caip2Id, bytes[] transactions)';
  const gsnDataAbiType = `(bool isRequired, string[] requiredNetworks, ${jobParametersAbiType}[] tokens)`;

  const transactionsBytes = data.transactions.map((transaction) => {
    const aptosTransaction: AptosRawTransaction = {
      function: transaction.function,
      typeArguments: transaction.typeArguments || [],
      functionArguments: transaction.functionArguments || [],
    };
    return toHex(stringToBytes(JSON.stringify(aptosTransaction)));
  });

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
              transactions: transactionsBytes,
            },
          ]),
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
      estimateResponse.userOps.callGasLimit ||
      toHex(Constants.GAS_LIMITS.CALL_GAS_LIMIT),
    verificationGasLimit:
      estimateResponse.userOps.verificationGasLimit ||
      toHex(Constants.GAS_LIMITS.VERIFICATION_GAS_LIMIT),
    preVerificationGas:
      estimateResponse.userOps.preVerificationGas ||
      toHex(Constants.GAS_LIMITS.PRE_VERIFICATION_GAS),
    maxFeePerGas: gasPrice.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    paymasterPostOpGasLimit:
      estimateResponse.userOps.paymasterPostOpGasLimit ||
      toHex(Constants.GAS_LIMITS.PAYMASTER_POST_OP_GAS_LIMIT),
    paymasterVerificationGasLimit:
      estimateResponse.userOps.paymasterVerificationGasLimit ||
      toHex(Constants.GAS_LIMITS.PAYMASTER_VERIFICATION_GAS_LIMIT),
    callData: estimateResponse.userOps.callData || calldata,
    paymasterData:
      estimateResponse.userOps.paymasterData ||
      (await oc.paymasterData({
        nonce: nonce,
        validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
      })),
  };

  return {
    userOp,
    details: estimateResponse.details,
  };
}
