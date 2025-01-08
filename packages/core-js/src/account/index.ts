import BffClientRepository from '@/api/bff.js';
import type {
  EstimateOrderPayload,
  Order,
  OrderEstimateResponse,
  UserPortfolioData,
  Wallet,
} from '@/types/bff/account.js';

class Account {
  /**
   * Private method to generate the EstimateOrderPayload.
   * It creates the necessary details for the order, optionally adds gas details and paymaster details, and returns the payload.
   *
   * @param {string} recipientWalletAddress The recipient's wallet address.
   * @param {string} networkId The network ID for the transaction.
   * @param {string} tokenAddress The token address involved in the transaction.
   * @param {string} amount The amount to be transferred.
   * @param {string} jobId The job ID for the order.
   * @param {boolean} useGasDetails Whether to include gas details in the payload (optional).
   * @param {boolean} usePaymaster Whether to include paymaster details in the payload (optional).
   * @returns {EstimateOrderPayload} The generated payload for the order estimate.
   */
  private _generateEstimateOrderPayload(
    recipientWalletAddress: string,
    networkId: string,
    tokenAddress: string,
    amount: string,
    jobId: string,
    useGasDetails: boolean = false,
    usePaymaster: boolean = false,
  ): EstimateOrderPayload {
    const payload: EstimateOrderPayload = {
      type: 'order_estimate', //TODO: check for type here (Sparsh)
      jobId,
      details: {
        recipientWalletAddress,
        networkId,
        tokenAddress,
        amount,
      },
    };

    if (useGasDetails) {
      payload.gasDetails = {
        maxFeePerGas: '1000000000', // TODO: add maxFeePerGas (Sparsh)
        maxPriorityFeePerGas: '2000000000', // TODO : add maxPriorityFeePerGas (Sparsh)
      };
    }

    if (usePaymaster) {
      payload.paymasterDetails = {
        validUntil: new Date(Date.now() + 3600 * 1000).toISOString(), // Valid for 1 hour. (Sparsh)
        validAfter: new Date(Date.now()).toISOString(), // Valid from the current time. (Sparsh)
      };
    }

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
   * @param {string} jobId The job ID for the order.
   * @param {boolean} useGasDetails Whether to include gas details in the payload (optional).
   * @param {boolean} usePaymaster Whether to include paymaster details in the payload (optional).
   * @returns {Promise<OrderEstimateResponse>} The estimated order response.
   */
  public async generateEstimateResponse(
    recipientWalletAddress: string,
    networkId: string,
    tokenAddress: string,
    amount: string,
    jobId: string,
    useGasDetails: boolean = false,
    usePaymaster: boolean = false,
  ): Promise<OrderEstimateResponse> {
    // Generate the payload using the private method.
    const payload = this._generateEstimateOrderPayload(
      recipientWalletAddress,
      networkId,
      tokenAddress,
      amount,
      jobId,
      useGasDetails,
      usePaymaster,
    );

    try {
      const estimateRes = await BffClientRepository.estimateOrder(payload);

      return estimateRes;
    } catch (error) {
      console.error('Error generating estimate order response:', error);
      throw error;
    }
  }

  /**
   * Retrieves the list of wallets for the authenticated user.
   *
   * @returns {Promise<Wallet[]>} A promise that resolves to an array of Wallet objects.
   */
  async getAccount(): Promise<Wallet[]> {
    try {
      return await BffClientRepository.getWallets();
    } catch (error) {
      console.error('Failed to retrieve wallets: ', error);
      throw error;
    }
  }

  /**
   * Retrieves the aggregated portfolio for the authenticated user.
   *
   * @returns {Promise<UserPortfolioData>} A promise that resolves to the aggregated portfolio data.
   */
  async getPortfolio(): Promise<UserPortfolioData> {
    try {
      return await BffClientRepository.getPortfolio();
    } catch (error) {
      console.error('Failed to retrieve portfolio: ', error);
      throw error;
    }
  }

  /**
   * Retrieves the list of orders for the authenticated user.
   *
   * @returns {Promise<Order[]>} A promise that resolves to an array of Order objects.
   */
  async getOrdersHistory(): Promise<Order[]> {
    try {
      return await BffClientRepository.getOrders();
    } catch (error) {
      console.error('Failed to retrieve orders: ', error);
      throw error;
    }
  }
}

export default Account;
