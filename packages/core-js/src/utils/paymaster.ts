import {
  encodeAbiParameters,
  encodePacked,
  keccak256,
  parseAbiParameters,
  type Hash,
  type Hex,
} from 'viem';
import { signMessage } from 'viem/accounts';
import { nonceToHex } from './nonce.js';

/**
 * Generates the default paymaster data used for authentication.
 *
 * @param privateKey Private Key of the Vendor.
 * @param validUntil Unix Timestamp in milliseconds of when the paymaster data is valid until.
 * @param validAfter Unix Timestamp in milliseconds of when the paymaster data is valid after.
 * @returns
 */
export async function generatePaymasterAndData(
  address: Hex,
  privateKey: Hex,
  nonce: string,
  validUntil: Date | number | bigint,
  validAfter?: Date | number | bigint,
): Promise<Hash> {
  if (validUntil instanceof Date) {
    validUntil = validUntil.getTime();
  } else if (typeof validUntil === 'bigint') {
    validUntil = parseInt(validUntil.toString());
  }

  if (validAfter instanceof Date) {
    validAfter = validAfter.getTime();
  } else if (typeof validAfter === 'bigint') {
    validAfter = parseInt(validAfter.toString());
  } else if (validAfter === undefined) {
    validAfter = 0;
  }

  const nonceHex: Hex = nonceToHex(nonce);

  const pe = encodePacked(
    ['bytes32', 'address', 'uint48', 'uint48'],
    [nonceHex, address, validUntil, validAfter],
  );
  const paymasterDataHash = keccak256(pe);

  const sig = await signMessage({
    message: paymasterDataHash,
    privateKey: privateKey,
  });

  const paymasterAndData = encodeAbiParameters(
    parseAbiParameters('address, uint48, uint48, bytes'),
    [address, validUntil, validAfter, sig],
  );

  return paymasterAndData;
}
