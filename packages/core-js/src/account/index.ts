import BffClientRepository from '@/api/bff.js';
import type OktoClient from '@/core/index.js';
import type {
  EstimateOrderPayload,
  OrderEstimateResponse,
} from '@/types/bff/account.js';
import { Constants } from '@/utils/constants.js';
import { v4 as uuidv4 } from 'uuid';

class Account {
  /**
   * Private method to generate the EstimateOrderPayload.
   * It creates the necessary details for the order, optionally adds gas details and paymaster details, and returns the payload.
   *
   * @param {string} recipientWalletAddress The recipient's wallet address.
   * @param {string} networkId The network ID for the transaction.
   * @param {string} tokenAddress The token address involved in the transaction.
   * @param {string} amount The amount to be transferred.
   * @param {boolean} useGasDetails Whether to include gas details in the payload (optional).
   * @param {boolean} usePaymaster Whether to include paymaster details in the payload (optional).
   * @returns {EstimateOrderPayload} The generated payload for the order estimate.
   */
  private static async _generateEstimateOrderPayload(
    oc: OktoClient,
    recipientWalletAddress: string,
    networkId: string,
    tokenAddress: string,
    amount: string,
  ): Promise<EstimateOrderPayload> {
    const nonce = uuidv4();

    const payload: EstimateOrderPayload = {
      type: 'TOKEN_TRANSFER',
      jobId: nonce,
      details: {
        recipientWalletAddress,
        networkId,
        tokenAddress,
        amount,
      },
    };

    payload.gasDetails = {
      maxFeePerGas: '0xBA43B7400', // TODO: add maxFeePerGas (Sparsh)
      maxPriorityFeePerGas: '0xBA43B7400', // TODO : add maxPriorityFeePerGas (Sparsh)
    };

    payload.paymasterData = await oc.paymasterData({
      nonce: nonce,
      validUntil: new Date(Date.now() + 6 * Constants.HOURS_IN_MS),
    });

    return payload;
  }

  /**
   * Public method to generate the estimate order response by calling the estimate API with the generated payload.
   * It uses the payload generated from the private _generateEstimateOrderPayload method.
   *
   * @param {string} recipientWalletAddress The recipient's wallet address.
   * @param {string} networkId The network ID for the transaction.
   * @param {string} tokenAddress The token address involved in the transaction.
   * @param {string} amount The amount to be transferred.
   * @param {boolean} useGasDetails Whether to include gas details in the payload (optional).
   * @param {boolean} usePaymaster Whether to include paymaster details in the payload (optional).
   * @returns {Promise<OrderEstimateResponse>} The estimated order response.
   */
  public static async estimate(
    oc: OktoClient,
    recipientWalletAddress: string,
    networkId: string,
    tokenAddress: string,
    amount: string,
  ): Promise<OrderEstimateResponse> {
    // Generate the payload using the private method.
    const payload = await this._generateEstimateOrderPayload(
      oc,
      recipientWalletAddress,
      networkId,
      tokenAddress,
      amount,
    );

    try {
      const estimateRes = await BffClientRepository.estimateOrder(oc, payload);

      return estimateRes;
    } catch (error) {
      console.error('Error generating estimate order response:', error);
      throw error;
    }
  }
}

export default Account;
