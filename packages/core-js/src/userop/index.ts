import { globalConfig } from '@/config/index.js';
import type { Hash, Hex, UserOp } from '@/types/core.js';
import { Constants } from '@/utils/index.js';
import { generateUUID, nonceToBigInt } from '@/utils/nonce.js';
import { generatePaymasterData } from '@/utils/paymaster.js';
import {
  encodeAbiParameters,
  encodeFunctionData,
  parseAbiParameters,
  toHex,
  type Address,
} from 'viem';
import UserOperationAbi from './abi.js';
import UserOperationConstants from './constants.js';
import type { NFTCollectionCreationIntentParams, NFTMintIntentParams, NFTTransferIntentParams, TokenTransferIntentParams } from './types.js';

class UserOperation extends UserOperationAbi {
  async tokenTransferUsingEstimate(data: any): Promise<UserOp> {
    const userop: UserOp = {
      sender: globalConfig.authOptions.userSWA as Address,
      paymaster: globalConfig.env.paymasterAddress,
      callData: data.userOps.callData,
      nonce: data.userOps.nonce,
      callGasLimit: data.userOps.callGasLimit,
      maxFeePerGas: data.userOps.maxFeePerGas,
      maxPriorityFeePerGas: data.userOps.maxPriorityFeePerGas,
      paymasterData: data.userOps.paymasterData,
      paymasterPostOpGasLimit: data.userOps.paymasterPostOpGasLimit,
      paymasterVerificationGasLimit: data.userOps.paymasterVerificationGasLimit,
      preVerificationGas: data.userOps.preVerificationGas,
      verificationGasLimit: data.userOps.verificationGasLimit,
    };

    return userop;
  }

  async tokenTransfer(data: TokenTransferIntentParams): Promise<UserOp> {
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
            globalConfig.authOptions.vendorSWA,
            globalConfig.authOptions.userSWA,
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
      sender: globalConfig.authOptions.userSWA as Address,
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
            encodePacked(['bool', 'bool'], [false, true]), // policyinfo
            '0x0', // gsnData
            encodeAbiParameters(
              parseAbiParameters('string, string, string, string, string, string'),
              [
                data.networkId,
                data.collectionAddress,
                data.nftId,
                data.recipientWalletAddress,
                data.amount,
                data.type,
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
      maxFeePerGas: BigInt(2000000000), // new api
      maxPriorityFeePerGas: BigInt(2000000000), // new api
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

  async nftCollectionCreation(data: NFTCollectionCreationIntentParams): Promise<UserOp> {
    const calldata = encodePacked(
      ['bytes4', 'address', 'bytes'],
      [
        UserOperationConstants.ExecuteUserOpFunctionSelector,
        '0xed8Fe2543efFF64FC3567B03b612AA82C409579a', // job manager address // TODO: Add to Config
        encodeFunctionData({
          abi: this.nftCollectionCreationAbi,
          functionName: 'initiateJob',
          args: [
            convertUUIDToInt(generateUUID()),
            globalConfig.authOptions.vendorSWA,
            globalConfig.authOptions.userSWA,
            encodePacked(['bool', 'bool'], [false, true]), // policyinfo  //TODO: get this data from user
            '0x0', // gsnData
            encodeAbiParameters(
              parseAbiParameters('string, string, string, string, string, string'),
              [data.networkId, data.name, data.description, data.metadataUri, data.symbol, data.type],
            ),
            'NFT_COLLECTION_CREATION',
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
      maxFeePerGas: BigInt(2000000000), // new api
      maxPriorityFeePerGas: BigInt(2000000000), // new api
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

  async nftMint(data: NFTMintIntentParams): Promise<UserOp> {
    const calldata = encodePacked(
      ['bytes4', 'address', 'bytes'],
      [
        UserOperationConstants.ExecuteUserOpFunctionSelector,
        '0xed8Fe2543efFF64FC3567B03b612AA82C409579a', // job manager address // TODO: Add to Config
        encodeFunctionData({
          abi: this.nftMintAbi,
          functionName: 'initiateJob',
          args: [
            convertUUIDToInt(generateUUID()),
            globalConfig.authOptions.vendorSWA,
            globalConfig.authOptions.userSWA,
            encodePacked(['bool', 'bool'], [false, true]), // policyinfo
            '0x0', // gsnData
            encodeAbiParameters(
              parseAbiParameters('string, string, string, string, string, string, string'),
              [
                data.networkId,
                data.type,
                data.collectionAddress,
                data.quantity,
                data.metadata.uri,
                data.metadata.nftName,
                data.metadata.description,
              ],
            ),
            'NFT_MINT',
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
      maxFeePerGas: BigInt(2000000000), // new api
      maxPriorityFeePerGas: BigInt(2000000000), // new api
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
