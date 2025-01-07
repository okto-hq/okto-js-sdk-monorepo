import { encodePacked, type Hash, type Hex } from 'viem';
import { generateNonce } from './nonce.js';
import { getPublicKey, signPayload } from './sessionKey.js';

/**
 * Generates the default paymaster data used for authentication.
 *
 * @param privateKey Private Key of the Vendor.
 * @param validUntil Unix Timestamp in milliseconds of when the paymaster data is valid until.
 * @param validAfter Unix Timestamp in milliseconds of when the paymaster data is valid after.
 * @returns
 */
export function generatePaymasterAndData(
  privateKey: string,
  validUntil: Date | number | bigint,
  validAfter?: Date | number | bigint,
): Hash {
  if (validUntil instanceof Date) {
    validUntil = BigInt(validUntil.getTime());
  } else if (typeof validUntil === 'number') {
    validUntil = BigInt(validUntil);
  }

  if (validAfter instanceof Date) {
    validAfter = BigInt(validAfter.getTime());
  } else if (typeof validAfter === 'number') {
    validAfter = BigInt(validAfter);
  } else if (validAfter === undefined) {
    validAfter = BigInt(0);
  }

  const vendorAddress = getPublicKey(privateKey) as Hex;
  const nonce = generateNonce();

  const paymasterDataHash = encodePacked(
    ['unit256', 'address', 'uint256', 'uint256'],
    [nonce, vendorAddress, validUntil, validAfter],
  );

  const sig = signPayload(paymasterDataHash, privateKey);

  const paymasterAndData = encodePacked(
    ['address', 'uint256', 'uint256', 'bytes'],
    [vendorAddress, validUntil, validAfter, sig as Hex],
  );

  return paymasterAndData;
}
