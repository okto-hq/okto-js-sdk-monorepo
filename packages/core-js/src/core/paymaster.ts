import {
  encodeAbiParameters,
  encodePacked,
  fromHex,
  keccak256,
  parseAbiParameters,
  toHex,
  type Hash,
  type Hex,
} from 'viem';
import { signMessage } from 'viem/accounts';
import { nonceToBigInt } from '../utils/nonce.js';

export async function generatePaymasterData(
  address: Hex,
  privateKey: Hex,
  nonce: string,
  validUntil: Date | number | bigint,
  validAfter?: Date | number | bigint,
): Promise<Hash> {
  if (validUntil instanceof Date) {
    validUntil = Math.floor(validUntil.getTime() / 1000);
  } else if (typeof validUntil === 'bigint') {
    validUntil = parseInt(validUntil.toString());
  }

  if (validAfter instanceof Date) {
    validAfter = Math.floor(validAfter.getTime() / 1000);
  } else if (typeof validAfter === 'bigint') {
    validAfter = parseInt(validAfter.toString());
  } else if (validAfter === undefined) {
    validAfter = 0;
  }

  const paymasterDataHash = keccak256(
    encodePacked(
      ['bytes32', 'address', 'uint48', 'uint48'],
      [
        toHex(nonceToBigInt(nonce), { size: 32 }),
        address,
        validUntil,
        validAfter,
      ],
    ),
  );

  const sig = await signMessage({
    message: {
      raw: fromHex(paymasterDataHash, 'bytes'),
    },
    privateKey: privateKey,
  });

  const paymasterData = encodeAbiParameters(
    parseAbiParameters('address, uint48, uint48, bytes'),
    [address, validUntil, validAfter, sig],
  );

  return paymasterData;
}
