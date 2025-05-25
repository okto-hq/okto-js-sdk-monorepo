import type OktoClient from '@/core/index.js';
import BffClientRepository from '@/api/bff.js';
import type { AddFundsData } from '@/types/onramp.js';

/**
 * Service to generate onramp URLs
 */
export class OnrampService {
  /**
   * Generate onramp URL for adding funds
   * @param oktoClient - OktoClient instance
   * @param tokenId - Token ID to add funds for
   * @param options - Optional configuration
   * @returns Promise<string> - The onramp URL
   */
  public async generateOnrampUrl(
    oktoClient: OktoClient,
    tokenId: string,
    options: {
      email?: string;
      countryCode?: string;
      theme?: 'light' | 'dark';
      appVersion?: string;
      screenSource?: string;
    } = {},
  ): Promise<string> {
    if (!oktoClient.isLoggedIn()) {
      throw new Error('User must be logged in');
    }

    const countryCode = options.countryCode || 'IN';

    try {
      // Get required data
      const [
        portfolio,
        wallets,
        userSession,
        transactionToken,
        supportedRampTokens,
      ] = await Promise.all([
        BffClientRepository.getPortfolio(oktoClient),
        BffClientRepository.getWallets(oktoClient),
        BffClientRepository.verifySession(oktoClient),
        BffClientRepository.generateTransactionToken(oktoClient),
        BffClientRepository.getSupportedRampTokens(
          oktoClient,
          countryCode,
          'onramp',
        ),
      ]);

      // Find token in portfolio
      const groupToken = portfolio.groupTokens.find(
        (group) =>
          group.id === tokenId ||
          (Array.isArray(group.tokens) &&
            group.tokens.some((token) => token.id === tokenId)),
      );

      if (!groupToken) {
        throw new Error(`Token ${tokenId} not found in portfolio`);
      }

      const token =
        groupToken.tokens.find((t) => t.id === tokenId) || groupToken;

      // Find whitelisted token from supported ramp tokens
      const whitelistedToken = supportedRampTokens.onrampTokens.find(
        (rampToken) => rampToken.tokenId === tokenId,
      );

      if (!whitelistedToken) {
        throw new Error(
          `Token ${tokenId} is not supported for onramp in ${countryCode}`,
        );
      }

      // Find wallet
      const wallet = wallets.find(
        (w) => w.networkId === whitelistedToken.networkId,
      );

      if (!wallet) {
        throw new Error(
          `Wallet not found for network ${whitelistedToken.networkId}`,
        );
      }

      // Create add funds data
      const addFundsData: AddFundsData = {
        walletAddress: wallet.address,
        walletBalance: token.balance,
        tokenId: token.id,
        networkId: whitelistedToken.networkId,
        tokenName: token.shortName,
        chain: wallet.networkName,
        userId: userSession.userId,
        email: options.email || '',
        countryCode: countryCode,
        theme: options.theme || 'light',
        app_version: options.appVersion || '500000',
        screen_source: options.screenSource || 'portfolio',
        payToken: transactionToken,
        platform: 'web',
        app: 'okto_web',
      };

      return this.buildOnrampUrl(oktoClient.env.onrampUrl, addFundsData);
    } catch (error) {
      console.error('Error generating onramp URL:', error);
      throw error;
    }
  }

  /**
   * Build the onramp URL with query parameters
   */
  private buildOnrampUrl(baseUrl: string, data: AddFundsData): string {
    const url = new URL(`${baseUrl}/deposit/add-funds`);

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    return url.toString();
  }
}
