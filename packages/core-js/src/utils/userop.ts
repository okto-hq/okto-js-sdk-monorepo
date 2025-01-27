import type { Hash, PackedUserOp, UserOp } from '@/types/core.js';
import {
  encodeAbiParameters,
  encodePacked,
  hexToBigInt,
  keccak256,
  pad,
  parseAbiParameters,
} from 'viem';

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
    throw new Error('Invalid UserOp');
  }

  const accountGasLimits: Hash = ('0x' +
    pad(userOp.verificationGasLimit, {
      size: 16,
    }).replace('0x', '') +
    pad(userOp.callGasLimit, {
      size: 16,
    }).replace('0x', '')) as Hash;

  const gasFees: Hash = ('0x' +
    pad(userOp.maxFeePerGas, {
      size: 16,
    }).replace('0x', '') +
    pad(userOp.maxPriorityFeePerGas, {
      size: 16,
    }).replace('0x', '')) as Hash;

  const paymasterAndData = encodePacked(
    ['address', 'bytes16', 'bytes16', 'bytes'],
    [
      userOp.paymaster,
      pad(userOp.paymasterVerificationGasLimit, {
        size: 16,
      }),
      pad(userOp.paymasterPostOpGasLimit, {
        size: 16,
      }),
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
      pad(userOp.nonce, {
        size: 32,
      }),
      pad(keccak256(userOp.initCode), {
        size: 32,
      }),
      pad(keccak256(userOp.callData), {
        size: 32,
      }),
      pad(userOp.accountGasLimits, {
        size: 32,
      }),
      hexToBigInt(userOp.preVerificationGas),
      pad(userOp.gasFees, {
        size: 32,
      }),
      pad(keccak256(userOp.paymasterAndData), {
        size: 32,
      }),
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
