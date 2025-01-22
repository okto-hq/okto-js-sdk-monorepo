import type { Hash, PackedUserOp, UserOp } from '@/types/core.js';
import {
  encodeAbiParameters,
  encodePacked,
  hexToBigInt,
  keccak256,
  parseAbiParameters,
} from 'viem';
import { updateHexPadding } from './nonce.js';

export function generatePackedUserOp(userOp: UserOp): PackedUserOp {
  // TODO: Add better checks; this is temporary and should not go to release
  if (
    !userOp.sender ||
    !userOp.nonce ||
    !userOp.callData ||
    !userOp.preVerificationGas ||
    !userOp.verificationGasLimit ||
    !userOp.callGasLimit ||
    !userOp.maxFeePerGas ||
    !userOp.maxPriorityFeePerGas ||
    userOp.paymaster == undefined ||
    !userOp.paymasterVerificationGasLimit ||
    !userOp.paymasterPostOpGasLimit
  ) {
    return {} as PackedUserOp;
  }

  const accountGasLimits: Hash = ('0x' +
    updateHexPadding(userOp.verificationGasLimit, 16).replace('0x', '') +
    updateHexPadding(userOp.callGasLimit, 16).replace('0x', '')) as Hash;

  const gasFees: Hash = ('0x' +
    updateHexPadding(userOp.maxFeePerGas, 16).replace('0x', '') +
    updateHexPadding(userOp.maxPriorityFeePerGas, 16).replace(
      '0x',
      '',
    )) as Hash;

  const paymasterAndData = encodePacked(
    ['address', 'bytes16', 'bytes16', 'bytes'],
    [
      userOp.paymaster,
      updateHexPadding(userOp.paymasterVerificationGasLimit, 32),
      updateHexPadding(userOp.paymasterPostOpGasLimit, 32),
      userOp.paymasterData!,
    ],
  );

  const packedUserOp: PackedUserOp = {
    sender: userOp.sender,
    nonce: userOp.nonce,
    initCode: '0x',
    callData: userOp.callData,
    preVerificationGas: userOp.preVerificationGas,
    accountGasLimits,
    gasFees,
    paymasterAndData,
  };

  return packedUserOp;
}

export function generateUserOpHash(userOp: PackedUserOp): Hash {
  const pack = encodeAbiParameters(
    parseAbiParameters(
      'address, bytes32, bytes32, bytes32, bytes32, uint256, bytes32, bytes32',
    ),
    [
      userOp.sender,
      updateHexPadding(userOp.nonce, 64),
      updateHexPadding(keccak256(userOp.initCode), 64),
      updateHexPadding(keccak256(userOp.callData), 64),
      updateHexPadding(userOp.accountGasLimits, 64),
      hexToBigInt(userOp.preVerificationGas),
      updateHexPadding(userOp.gasFees, 64),
      updateHexPadding(keccak256(userOp.paymasterAndData), 64),
    ],
  );

  const userOpPack = encodeAbiParameters(
    parseAbiParameters('bytes32, address, uint256'),
    [
      keccak256(pack),
      '0xb0C42f19bBb23E52f75813404eeEc0D189b3A61B',
      BigInt(24979),
    ],
  );

  return keccak256(userOpPack);
}
