import type OktoClient from '@/core/index.js';
import type { TokenSwapIntentParams } from '@/types/bff/index.js';
import { swapToken as useropgen } from '@/userop/swapToken.js';

/**
 * Swap tokens.
 *
 * This function initiates the process of swapping tokens by encoding
 * the necessary parameters into a User Operation. The operation is then
 * submitted through the OktoClient for execution.
 *
 * @param oc - The OktoClient instance used to interact with the blockchain.
 * @param data - The parameters for swapping tokens (fromChainCaip2Id, toChainCaip2Id, fromChainTokenAddress,
 *               toChainTokenAddress, fromChainTokenAmount, minToTokenAmount, slippage, etc.).
 * @returns Transaction hash for the token swap operation.
 */
export async function swapToken(
  oc: OktoClient,
  data: TokenSwapIntentParams,
): Promise<string> {
  if (!oc.isLoggedIn()) {
    throw new Error('User not logged in');
  }
  const { userOp } = await useropgen(oc, data);
  const signedUserOp = await oc.signUserOp(userOp);
  const res = await oc.executeUserOp(signedUserOp);
  return res;
}
