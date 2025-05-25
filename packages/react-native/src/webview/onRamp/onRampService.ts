import { OnrampRemoteConfig } from '../onRamp/onRampRemoteConfig.js';
import { OktoClient } from '@okto_web3/core-js-sdk';
import {
  generateTransactionToken,
  getPortfolio,
  getSupportedRampTokens,
} from '@okto_web3/core-js-sdk/explorer';
import type {
  ApiResponse,
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

export type WhitelistedToken =
  SupportedRampTokensResponse['onrampTokens'][number];

// Permission request/response types
interface PermissionRequest {
  permission: string;
  rationale?: string;
}

interface PermissionResponse {
  status: string;
  permission: string;
  granted: boolean;
  message?: string;
}

export class OnRampService {
  private remoteConfig: OnrampRemoteConfig;
  private oktoClient: OktoClient;
  private config: OnrampConfig;

  constructor(config: Partial<OnrampConfig> = {}, oktoClient: OktoClient) {
    this.remoteConfig = OnrampRemoteConfig.getInstance();
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
      console.log('KARAN :: Generating transaction token...');
      return await generateTransactionToken(this.oktoClient);
    } catch (error) {
      console.error('Error getting transaction token:', error);
      throw error;
    }
  }

  async getTokenData(): Promise<WhitelistedToken[]> {
    try {
      console.log('KARAN :: Fetching supported tokens for onramp...');
      const supportedTokens = await getSupportedRampTokens(
        this.oktoClient,
        'IN',
        'onramp',
      );
      return supportedTokens.onrampTokens;
    } catch (error) {
      console.error('Error fetching onramp tokens:', error);
      throw error;
    }
  }

  async getPortfolioData(): Promise<UserPortfolioData> {
    try {
      const response = await getPortfolio(this.oktoClient);
      return response;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  async getOnRampTokens(): Promise<OnRampToken[]> {
    const [whitelistedTokens, portfolio] = await Promise.all([
      this.getTokenData(),
      this.getPortfolioData(),
    ]);

    const flatPortfolioTokens = portfolio.groupTokens.flatMap(
      (group) => group.tokens,
    );

    return whitelistedTokens.map((whitelistedToken) => {
      const matchingToken = flatPortfolioTokens.find(
        (token) =>
          token.tokenAddress.toLowerCase() ===
          whitelistedToken.address.toLowerCase(),
      );

      return {
        id: whitelistedToken.tokenId,
        name: whitelistedToken.name,
        symbol: whitelistedToken.shortName,
        iconUrl: whitelistedToken.logo,
        networkId: whitelistedToken.networkId,
        networkName: whitelistedToken.networkName,
        address: whitelistedToken.address,
        balance: matchingToken?.balance,
        precision: matchingToken?.precision ?? whitelistedToken.precision,
        chainId: whitelistedToken.chainId,
      };
    });
  }

  async getRemoteConfigValue(key: string): Promise<string> {
    try {
      const configValue = await this.remoteConfig.getValue(key);
      return configValue.stringValue || '';
    } catch (error) {
      console.error('Error getting remote config:', error);
      return '';
    }
  }

  /**
   * Maps permission string to react-native-permissions Permission type
   */
  private getPermissionType(permissionString: string): Permission | null {
    const permissionMap: Record<string, Permission> = {
      camera:
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA,
      microphone:
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO,
      location:
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      photo_library:
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.PHOTO_LIBRARY
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      contacts:
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CONTACTS
          : PERMISSIONS.ANDROID.READ_CONTACTS,
      // 'notifications': Platform.OS === 'ios' ? PERMISSIONS.IOS.NOTIFICATIONS : PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
    };

    return permissionMap[permissionString.toLowerCase()] || null;
  }

  /**
   * Maps PermissionStatus to user-friendly status string
   */
  private mapPermissionStatus(status: PermissionStatus): {
    status: string;
    granted: boolean;
    message?: string;
  } {
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
          message: 'Permission not available on this device',
        };
      default:
        return {
          status: 'unknown',
          granted: false,
          message: 'Unknown permission status',
        };
    }
  }

  /**
   * Request camera permission specifically
   */
  async requestCameraPermission(): Promise<PermissionResponse> {
    console.log('KARAN :: Requesting camera permission...');

    try {
      const permission = this.getPermissionType('camera');
      if (!permission) {
        return {
          status: 'unavailable',
          permission: 'camera',
          granted: false,
          message: 'Camera permission not available on this platform',
        };
      }

      const result = await request(permission);
      const mappedResult = this.mapPermissionStatus(result);

      console.log('KARAN :: Camera permission result:', result);

      return {
        permission: 'camera',
        ...mappedResult,
      };
    } catch (error) {
      console.error('KARAN :: Error requesting camera permission:', error);
      return {
        status: 'error',
        permission: 'camera',
        granted: false,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generic permission request handler
   * Handles both single permission requests and multiple permissions
   */
  async requestPermissions(
    permissionData: any,
  ): Promise<PermissionResponse | PermissionResponse[]> {
    console.log('KARAN :: Requesting permissions:', permissionData);

    try {
      // Handle single permission request
      if (typeof permissionData === 'string') {
        return await this.requestSinglePermission(permissionData);
      }

      // Handle permission object with specific permission type
      if (permissionData.permission) {
        return await this.requestSinglePermission(
          permissionData.permission,
          permissionData.rationale,
        );
      }

      // Handle array of permissions
      if (Array.isArray(permissionData)) {
        const results = await Promise.all(
          permissionData.map(async (perm) => {
            if (typeof perm === 'string') {
              return await this.requestSinglePermission(perm);
            } else if (perm.permission) {
              return await this.requestSinglePermission(
                perm.permission,
                perm.rationale,
              );
            }
            return {
              status: 'error',
              permission: 'unknown',
              granted: false,
              message: 'Invalid permission format',
            };
          }),
        );
        return results;
      }

      // Handle object with multiple permission keys
      if (typeof permissionData === 'object') {
        const permissions = Object.keys(permissionData);
        const results = await Promise.all(
          permissions.map(
            async (perm) => await this.requestSinglePermission(perm),
          ),
        );
        return results;
      }

      throw new Error('Invalid permission data format');
    } catch (error) {
      console.error('KARAN :: Error in requestPermissions:', error);
      return {
        status: 'error',
        permission: 'unknown',
        granted: false,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Request a single permission
   */
  private async requestSinglePermission(
    permissionString: string,
    rationale?: string,
  ): Promise<PermissionResponse> {
    console.log(`KARAN :: Requesting single permission: ${permissionString}`);

    // Handle camera permission specifically (most common use case for onramp)
    if (permissionString.toLowerCase() === 'camera') {
      return await this.requestCameraPermission();
    }

    try {
      const permission = this.getPermissionType(permissionString);
      if (!permission) {
        return {
          status: 'unavailable',
          permission: permissionString,
          granted: false,
          message: `${permissionString} permission not available on this platform`,
        };
      }

      const result = await request(permission);
      const mappedResult = this.mapPermissionStatus(result);

      console.log(`KARAN :: ${permissionString} permission result:`, result);

      return {
        permission: permissionString,
        ...mappedResult,
      };
    } catch (error) {
      console.error(
        `KARAN :: Error requesting ${permissionString} permission:`,
        error,
      );
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
