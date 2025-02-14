import type OktoClient from '@/core/index.js';
import { BaseError } from '@/errors/base.js';
import { getChains } from '@/explorer/chain.js';
import type { UserOp } from '@/types/core.js';
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
import type { EVMRawTransaction, RawTransactionIntentParams } from './types.js';
import { RawTransactionIntentParamsSchema } from './userOpInputValidator.js';

/**
 * Creates a user operation for EVM Raw Transaction.
 */
export async function evmRawTransaction(
  oc: OktoClient,
  data: RawTransactionIntentParams,
): Promise<UserOp> {
  if (!oc.isLoggedIn) {
    throw new BaseError('User not logged in');
  }
  RawTransactionIntentParamsSchema.parse(data);

  const transaction: EVMRawTransaction = {
    from: data.transaction.from,
    to: data.transaction.to,
    data: data.transaction.data ?? '0x',
    value: numberToHex(data.transaction.value ?? 0),
  };

  const nonce = generateUUID();

  const jobParametersAbiType = '(string caip2Id, bytes[] transactions)';
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
          ), // policyinfo  //TODO: get this data from user
          encodeAbiParameters(parseAbiParameters(gsnDataAbiType), [
            {
              isRequired: false,
              requiredNetworks: [],
              tokens: [],
            },
          ]), // gsnData
          jobparam,
          'RAW_TRANSACTION',
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
