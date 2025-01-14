import { parse, v4 as uuidv4 } from 'uuid';

export function nonceToBigInt(nonce: string): bigint {
  const nonceBytes = parse(nonce);
  let nonceBigInt = BigInt(0);

  for (let i = 0; i < nonceBytes.length; i++) {
    const byte = nonceBytes[i] ?? 0;
    nonceBigInt = (nonceBigInt << BigInt(8)) | BigInt(byte);
  }

  return nonceBigInt;
}

export function generateNonce(): bigint {
  return nonceToBigInt(uuidv4());
}

export function generateUUID() {
  return uuidv4();
}
