import { Platform } from 'react-native';
import {
  request,
  PERMISSIONS,
  RESULTS,
  type PermissionStatus,
  type Permission,
} from 'react-native-permissions';
import { OktoClient } from '@okto_web3/core-js-sdk';
import {
  generateTransactionToken,
  getPortfolio,
  getSupportedRampTokens,
} from '@okto_web3/core-js-sdk/explorer';
import type {
  UserPortfolioData,
  SupportedRampTokensResponse,
} from '@okto_web3/core-js-sdk/types';
import type { OnrampConfig, OnRampToken } from './types.js';
import { RemoteConfigService } from './onRampRemoteConfig.js';

type WhitelistedToken = SupportedRampTokensResponse['onrampTokens'][number];

interface PermissionResponse {
  status:
    | 'granted'
    | 'denied'
    | 'blocked'
    | 'limited'
    | 'unavailable'
    | 'error';
  permission: 'camera';
  granted: boolean;
  message?: string;
}

export class OnRampService {
  private readonly remoteConfig: RemoteConfigService;
  private readonly oktoClient: OktoClient;
  private readonly config: OnrampConfig;

  private readonly CAMERA_PERMISSION: Permission = Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  }) as Permission;

  constructor(config: Partial<OnrampConfig> = {}, oktoClient: OktoClient) {
    this.remoteConfig = RemoteConfigService.getInstance();
    this.oktoClient = oktoClient;
    this.config = {
      onRampEnabled: true,
      theme: 'light',
      countryCode: 'US',
      appVersion: '1.0.0',
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };
  }

  async getTransactionToken(): Promise<string> {
    try {
      return await generateTransactionToken(this.oktoClient);
    } catch (error) {
      console.error('Error getting transaction token:', error);
      throw error;
    }
  }

  async getTokenData(countryCode: string = 'IN'): Promise<WhitelistedToken[]> {
    try {
      const { onrampTokens } = await getSupportedRampTokens(
        this.oktoClient,
        countryCode,
        'onramp',
      );
      return onrampTokens;
    } catch (error) {
      console.error('Error fetching onramp tokens:', error);
      throw error;
    }
  }

  async getPortfolioData(): Promise<UserPortfolioData> {
    try {
      return await getPortfolio(this.oktoClient);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  async getOnRampTokens(): Promise<OnRampToken[]> {
    const [whitelistedTokens, portfolio] = await Promise.all([
      this.getTokenData(this.config.countryCode),
      this.getPortfolioData(),
    ]);

    const portfolioTokens = portfolio.groupTokens.flatMap(
      (group) => group.tokens,
    );

    return whitelistedTokens.map((token) => {
      const portfolioToken = portfolioTokens.find(
        (pt) => pt.tokenAddress.toLowerCase() === token.address.toLowerCase(),
      );

      return {
        id: token.tokenId,
        name: token.name,
        symbol: token.shortName,
        iconUrl: token.logo,
        networkId: token.networkId,
        networkName: token.networkName,
        address: token.address,
        balance: portfolioToken?.balance,
        precision: portfolioToken?.precision ?? token.precision,
        chainId: token.chainId,
      };
    });
  }

  async getRemoteConfigValue(key: string): Promise<string> {
    try {
      const configValue = await this.remoteConfig.getConfigValue(key);
      return configValue.stringValue;
    } catch (error) {
      console.error('Error getting remote config:', error);
      return '';
    }
  }

  async requestCameraPermission(): Promise<PermissionResponse> {
    try {
      const result = await request(this.CAMERA_PERMISSION);
      console.log(
        `[OnRampService] Camera permission status: ${result}`,)
      return {
        permission: 'camera',
        ...this.mapPermissionStatus(result),
      };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return {
        permission: 'camera',
        status: 'error',
        granted: false,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private mapPermissionStatus(
    status: PermissionStatus,
  ): Omit<PermissionResponse, 'permission'> {
    switch (status) {
      case RESULTS.GRANTED:
        return { status: 'granted', granted: true };
      case RESULTS.DENIED:
        return {
          status: 'denied',
          granted: false,
          message: 'Permission denied by user',
        };
      case RESULTS.BLOCKED:
        return {
          status: 'blocked',
          granted: false,
          message: 'Permission blocked. Please enable in device settings.',
        };
      case RESULTS.LIMITED:
        return {
          status: 'limited',
          granted: true,
          message: 'Permission granted with limitations',
        };
      case RESULTS.UNAVAILABLE:
        return {
          status: 'unavailable',
          granted: false,
          message: 'Permission not available',
        };
      default:
        return {
          status: 'error',
          granted: false,
          message: 'Unknown permission status',
        };
    }
  }

  getConfig(): OnrampConfig {
    return this.config;
  }
}
