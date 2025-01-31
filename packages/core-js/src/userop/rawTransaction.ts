import type OktoClient from '@/core/index.js';
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

/**
 * Creates a user operation for EVM Raw Transaction.
 */
export async function evmRawTransaction(
  oc: OktoClient,
  data: RawTransactionIntentParams,
): Promise<UserOp> {
  const transaction: EVMRawTransaction = {
    from: data.transaction.from,
    to: data.transaction.to,
    data: data.transaction.data ?? '0x',
    value: numberToHex(data.transaction.value ?? 0),
  };

  const nonce = generateUUID();

  const jobParametersAbiType = '(string caip2Id, bytes[] transactions)';
  const gsnDataAbiType = `(bool isRequired, string[] requiredNetworks, ${jobParametersAbiType}[] tokens)`;

  const jobparam = encodeAbiParameters(
    parseAbiParameters(jobParametersAbiType),
    [
      {
        caip2Id: data.networkId,
        transactions: [toHex(stringToBytes(JSON.stringify(transaction)))],
      },
    ],
  );

  console.info('transaction:', JSON.stringify(transaction, null, 2));
  console.info('jobparam:', jobparam);

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
                gsnEnabled: false,
                sponsorshipEnabled: false,
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
