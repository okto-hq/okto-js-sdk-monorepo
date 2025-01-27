import { globalConfig } from '@/config/index.js';
import type OktoClient from '@/core/index.js';
import type { UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import {
  encodeAbiParameters,
  encodeFunctionData,
  parseAbiParameters,
  toHex,
} from 'viem';
import UserOperationAbi from './abi.js';
import UserOperationConstants from './constants.js';
import type { TokenTransferIntentParams } from './types.js';

class UserOperation extends UserOperationAbi {
  // async tokenTransferUsingEstimate(oc: OktoClient, data: any): Promise<UserOp> {
  //   const userop: UserOp = {
  //     sender: oc.gc.authOptions.userSWA as Address,
  //     paymaster: oc.gc.env.paymasterAddress,
  //     callData: data.userOps.callData,
  //     nonce: data.userOps.nonce,
  //     callGasLimit: data.userOps.callGasLimit,
  //     maxFeePerGas: data.userOps.maxFeePerGas,
  //     maxPriorityFeePerGas: data.userOps.maxPriorityFeePerGas,
  //     paymasterData: data.userOps.paymasterData,
  //     paymasterPostOpGasLimit: data.userOps.paymasterPostOpGasLimit,
  //     paymasterVerificationGasLimit: data.userOps.paymasterVerificationGasLimit,
  //     preVerificationGas: data.userOps.preVerificationGas,
  //     verificationGasLimit: data.userOps.verificationGasLimit,
  //   };

  //   return userop;
  // }

  async tokenTransfer(
    oc: OktoClient,
    data: TokenTransferIntentParams,
  ): Promise<UserOp> {
    const nonce = generateUUID();

    const jobParametersAbiType =
      '(string networkId, string recipientWalletAddress, string tokenAddress, uint amount)';
    const gsnDataAbiType = `(bool isRequired, string[] requiredNetworks, ${jobParametersAbiType}[] tokens)`;

    const calldata = encodeAbiParameters(
      parseAbiParameters('bytes4, address, bytes'),
      [
        UserOperationConstants.ExecuteUserOpFunctionSelector,
        '0xed8Fe2543efFF64FC3567B03b612AA82C409579a', // job manager address // TODO: Add to Config
        encodeFunctionData({
          abi: this.tokenTransferAbi,
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
            encodeAbiParameters(parseAbiParameters(jobParametersAbiType), [
              {
                amount: BigInt(data.amount),
                networkId: data.chain,
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
      paymaster: globalConfig.env.paymasterAddress,
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
}

export default UserOperation;
