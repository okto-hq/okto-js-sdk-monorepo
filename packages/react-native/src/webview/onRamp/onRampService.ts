import { RemoteConfigService } from './onRampRemoteConfig.js';
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
import {
  request,
  PERMISSIONS,
  RESULTS,
  type PermissionStatus,
  type Permission,
} from 'react-native-permissions';
import { Platform } from 'react-native';

type WhitelistedToken = SupportedRampTokensResponse['onrampTokens'][number];

interface PermissionResponse {
  status:
    | 'granted'
    | 'denied'
    | 'blocked'
    | 'limited'
    | 'unavailable'
    | 'error';
  permission: string;
  granted: boolean;
  message?: string;
}

const PERMISSION_MAP: Record<string, Permission> = {
  camera: Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  }) as Permission,
  microphone: Platform.select({
    ios: PERMISSIONS.IOS.MICROPHONE,
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
  }) as Permission,
  location: Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  }) as Permission,
  photo_library: Platform.select({
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
    android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  }) as Permission,
  contacts: Platform.select({
    ios: PERMISSIONS.IOS.CONTACTS,
    android: PERMISSIONS.ANDROID.READ_CONTACTS,
  }) as Permission,
};

export class OnRampService {
  private readonly remoteConfig: RemoteConfigService;
  private readonly oktoClient: OktoClient;
  private readonly config: OnrampConfig;

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

  private mapPermissionStatus(
    status: PermissionStatus,
  ): Omit<PermissionResponse, 'permission'> {
    type StatusResult = Omit<PermissionResponse, 'permission'>;

    const statusMap: Record<string, StatusResult> = {
      [RESULTS.GRANTED]: { status: 'granted', granted: true },
      [RESULTS.DENIED]: {
        status: 'denied',
        granted: false,
        message: 'Permission denied by user',
      },
      [RESULTS.BLOCKED]: {
        status: 'blocked',
        granted: false,
        message: 'Permission blocked. Please enable in device settings.',
      },
      [RESULTS.LIMITED]: {
        status: 'limited',
        granted: true,
        message: 'Permission granted with limitations',
      },
      [RESULTS.UNAVAILABLE]: {
        status: 'unavailable',
        granted: false,
        message: 'Permission not available',
      },
    };

    const defaultResult: StatusResult = {
      status: 'error',
      granted: false,
      message: 'Unknown permission status',
    };

    return statusMap[status] || defaultResult;
  }

  async requestCameraPermission(): Promise<PermissionResponse> {
    return this.requestSinglePermission('camera');
  }

  async requestPermissions(
    permissions: string | string[] | Record<string, any>,
  ): Promise<PermissionResponse | PermissionResponse[]> {
    if (typeof permissions === 'string') {
      return this.requestSinglePermission(permissions);
    }

    if (Array.isArray(permissions)) {
      return Promise.all(
        permissions.map((perm) =>
          typeof perm === 'string'
            ? this.requestSinglePermission(perm)
            : this.requestSinglePermission(perm.permission),
        ),
      );
    }

    if (typeof permissions === 'object') {
      return Promise.all(
        Object.keys(permissions).map((perm) =>
          this.requestSinglePermission(perm),
        ),
      );
    }

    throw new Error('Invalid permission data format');
  }

  private async requestSinglePermission(
    permissionString: string,
  ): Promise<PermissionResponse> {
    const permissionKey = permissionString.toLowerCase();
    const permission = PERMISSION_MAP[permissionKey];

    if (!permission) {
      return {
        status: 'unavailable',
        permission: permissionString,
        granted: false,
        message: `${permissionString} permission not available on this platform`,
      };
    }

    try {
      const result = await request(permission);
      const mappedResult = this.mapPermissionStatus(result);

      return {
        permission: permissionString,
        ...mappedResult,
      };
    } catch (error) {
      console.error(`Error requesting ${permissionString} permission:`, error);
      return {
        status: 'error',
        permission: permissionString,
        granted: false,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  getConfig(): OnrampConfig {
    return this.config;
  }
}
