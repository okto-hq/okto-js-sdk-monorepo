import { globalConfig } from '@/config/index.js';
import type { Hash, Hex, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import {
  convertUUIDToInt,
  generateUUID,
  nonceToBigInt,
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
import type {
  NFTTransferIntentParams,
  TokenTransferIntentParams,
} from './types.js';
import type { GasFeeData } from '@/types/index.js';
import BffClientRepository from '@/api/bff.js';

class UserOperation extends UserOperationAbi {
  private async getGasValues(): Promise<GasFeeData> {
    try {
      return await BffClientRepository.getGasValues();
    } catch (error) {
      console.error('Failed to retrieve gas values: ', error);
      throw error;
    }
  }

  async tokenTransfer(data: TokenTransferIntentParams): Promise<UserOp> {
    const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasValues();
    const calldata = encodePacked(
      ['bytes4', 'address', 'bytes'],
      [
        UserOperationConstants.ExecuteUserOpFunctionSelector,
        '0xed8Fe2543efFF64FC3567B03b612AA82C409579a', // job manager address // TODO: Add to Config
        encodeFunctionData({
          abi: this.tokenTransferAbi,
          functionName: 'initiateJob',
          args: [
            convertUUIDToInt(generateUUID()),
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

    const nonce = generateUUID();

    const userOp: UserOp = {
      sender: globalConfig.authOptions.userSWA as Address,
      nonce: nonceToBigInt(nonce),
      paymaster: globalConfig.env.paymasterAddress,
      callGasLimit: BigInt(300_000), // new api OR estimate
      verificationGasLimit: BigInt(200_000), // estimate
      preVerificationGas: BigInt(50_000), // estimate
      maxFeePerGas: BigInt(maxFeePerGas), // new api
      maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas), // new api
      paymasterPostOpGasLimit: BigInt(100000),
      paymasterVerificationGasLimit: BigInt(100000),
      callData: calldata,
      paymasterData: await generatePaymasterData(
        globalConfig.authOptions.vendorSWA as Hex,
        globalConfig.authOptions.vendorPrivKey as Hash,
        nonce,
        new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
        new Date(),
      ),
    };

    return userOp;
  }

  async nftTransfer(data: NFTTransferIntentParams): Promise<UserOp> {
    const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasValues();
    const calldata = encodePacked(
      ['bytes4', 'address', 'bytes'],
      [
        UserOperationConstants.ExecuteUserOpFunctionSelector,
        '0xed8Fe2543efFF64FC3567B03b612AA82C409579a', // job manager address // TODO: Add to Config
        encodeFunctionData({
          abi: this.nftTransferAbi,
          functionName: 'initiateJob',
          args: [
            convertUUIDToInt(generateUUID()),
            globalConfig.authOptions.vendorSWA,
            globalConfig.authOptions.userSWA,
            encodePacked(['bool', 'bool'], [false, true]), // policyinfo  //TODO: get this data from user
            '0x0', // gsnData
            encodeAbiParameters(
              parseAbiParameters('string, string, string, uint256,string'),
              [
                data.networkId,
                data.nftId,
                data.recipient,
                BigInt(data.amount),
                data.ercType,
              ],
            ),
            'NFT_TRANSFER',
          ],
        }),
      ],
    );

    const nonce = generateUUID();

    const userOp: UserOp = {
      sender: globalConfig.authOptions.userSWA as Address,
      nonce: nonceToBigInt(nonce),
      paymaster: globalConfig.env.paymasterAddress,
      callGasLimit: BigInt(300_000), // new api OR estimate
      verificationGasLimit: BigInt(200_000), // estimate
      preVerificationGas: BigInt(50_000), // estimate
      maxFeePerGas: BigInt(maxFeePerGas), // new api
      maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
      paymasterPostOpGasLimit: BigInt(100000),
      paymasterVerificationGasLimit: BigInt(100000),
      callData: calldata,
      paymasterData: await generatePaymasterData(
        globalConfig.authOptions.vendorSWA as Hex,
        globalConfig.authOptions.vendorPrivKey as Hash,
        nonce,
        new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
        new Date(),
      ),
    };

    return userOp;
  }
}

export default UserOperation;
