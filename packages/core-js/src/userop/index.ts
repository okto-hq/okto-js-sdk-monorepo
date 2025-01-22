import { globalConfig } from '@/config/index.js';
import type { Hash, Hex, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import {
  bigintToHex,
  convertUUIDToInt,
  generateUUID,
  nonceToHex,
} from '@/utils/nonce.js';
import { generatePaymasterData } from '@/utils/paymaster.js';
import {
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  parseAbiParameters,
  type Address,
} from 'viem';
import UserOperationAbi from './abi.js';
import UserOperationConstants from './constants.js';
import type { TokenTransferIntentParams } from './types.js';

class UserOperation extends UserOperationAbi {
  async tokenTransfer(data: TokenTransferIntentParams): Promise<UserOp> {
    const nonce = generateUUID();
    const calldata = encodePacked(
      ['bytes4', 'address', 'bytes'],
      [
        UserOperationConstants.ExecuteUserOpFunctionSelector,
        '0xed8Fe2543efFF64FC3567B03b612AA82C409579a', // job manager address // TODO: Add to Config
        encodeFunctionData({
          abi: this.tokenTransferAbi,
          functionName: 'initiateJob',
          args: [
            convertUUIDToInt(nonce),
            globalConfig.authOptions.vendorSWA,
            globalConfig.authOptions.userSWA,
            encodePacked(['bool', 'bool'], [false, true]), // policyinfo  //TODO: get this data from user
            '0x0', // gsnData
            encodeAbiParameters(
              parseAbiParameters('string, string, string, uint256'),
              [data.chain, data.recipient, data.token, BigInt(data.amount)],
            ),
            'TOKEN_TRANSFER',
          ],
        }),
      ],
    );

    const userOp: UserOp = {
      sender: globalConfig.authOptions.userSWA as Address,
      nonce: convertUUIDToInt(nonce),
      paymaster: globalConfig.env.paymasterAddress,
      callGasLimit: bigintToHex(BigInt(300_000)), // new api OR estimate
      verificationGasLimit: bigintToHex(BigInt(200_000)), // estimate
      preVerificationGas: bigintToHex(BigInt(50_000)), // estimate
      maxFeePerGas: bigintToHex(BigInt(2000000000)), // new api
      maxPriorityFeePerGas: bigintToHex(BigInt(2000000000)), // new api
      paymasterPostOpGasLimit: bigintToHex(BigInt(100000)),
      paymasterVerificationGasLimit: bigintToHex(BigInt(100000)),
      callData: calldata,
      paymasterData: await generatePaymasterData(
        globalConfig.authOptions.vendorSWA as Hex,
        globalConfig.authOptions.vendorPrivKey as Hash,
        nonceToHex(nonce),
        new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
        new Date(),
      ),
    };

    return userOp;
  }
}

export default UserOperation;
