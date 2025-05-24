// OnRampService.ts
import { OnRampWebViewBridge } from './webViewBridge.js';
import { OnrampRemoteConfig } from '../onRamp/onRampRemoteConfig.js';
import {
  OnRampDataKeys,
  OnRampEvents,
  type OnrampCallbacks,
  type OnrampConfig,
} from './types.js';
import type { MutableRefObject } from 'react';
import { WebView } from 'react-native-webview';
import { PermissionsAndroid, Platform, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { OktoClient } from '@okto_web3/core-js-sdk';
import {
  generateTransactionToken,
  getSupportedRampTokens,
} from '@okto_web3/core-js-sdk/explorer';

/**
 * OnRampService - Service for handling OnRamp WebView operations
 * Uses dedicated OnRampWebViewBridge for clean separation from auth flows
 */
export class OnRampService {
  private bridge: OnRampWebViewBridge | null = null;
  private remoteConfig: OnrampRemoteConfig;
  private oktoClient: OktoClient;
  private config: OnrampConfig;
  private isInitialized = false;

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

  /**
   * Initialize the OnRamp service
   */
  public async initialize(
    webViewRef: MutableRefObject<WebView | null>,
    oktoClient: any,
    callbacks: OnrampCallbacks = {},
  ): Promise<void> {
    try {
      if (this.isInitialized) {
        console.warn('OnRampService already initialized');
        return;
      }

      this.oktoClient = oktoClient;
      this.bridge = new OnRampWebViewBridge(webViewRef, callbacks);

      await this.setupBridgeHandlers();
      this.isInitialized = true;

      console.log('OnRampService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OnRampService:', error);
      throw error;
    }
  }

  /**
   * Set up bridge message handlers
   */
  private async setupBridgeHandlers(): Promise<void> {
    if (!this.bridge) return;

    // Data request handlers
    this.bridge.registerRequestHandler(
      OnRampEvents.DATA_REQUEST,
      this.handleDataRequest.bind(this),
    );

    this.bridge.registerRequestHandler(
      OnRampEvents.TRANSACTION_TOKEN,
      this.handleTransactionTokenRequest.bind(this),
    );

    this.bridge.registerRequestHandler(
      OnRampEvents.TOKEN_DATA,
      this.handleTokenDataRequest.bind(this),
    );

    this.bridge.registerRequestHandler(
      OnRampEvents.REMOTE_CONFIG,
      this.handleRemoteConfigRequest.bind(this),
    );

    // Permission handlers
    this.bridge.registerRequestHandler(
      OnRampEvents.REQUEST_PERMISSIONS,
      this.handlePermissionRequest.bind(this),
    );

    this.bridge.registerRequestHandler(
      OnRampEvents.CAMERA_PERMISSION,
      this.handleCameraPermissionRequest.bind(this),
    );

    // Navigation handlers
    this.bridge.registerRequestHandler(
      OnRampEvents.OPEN_URL,
      this.handleOpenUrlRequest.bind(this),
    );

    // Configuration handlers
    this.bridge.registerRequestHandler(
      OnRampEvents.APP_CONFIG,
      this.handleAppConfigRequest.bind(this),
    );
  }

  /**
   * Handle generic data requests
   */
  private async handleDataRequest(request: any): Promise<any> {
    const { key, source } = request.params || {};
    console.log('Handling data request for key:', key, 'from source:', source);

    switch (key) {
      case OnRampDataKeys.TRANSACTION_TOKEN:
        return this.getTransactionToken();

      case OnRampDataKeys.TOKEN_DATA:
        return this.getTokenData();

      case OnRampDataKeys.REMOTE_CONFIG:
        return this.getRemoteConfigValue(source);

      case OnRampDataKeys.USER_EMAIL:
        return this.getUserEmail();

      case OnRampDataKeys.WALLET_ADDRESS:
        return this.getWalletAddress();

      case OnRampDataKeys.APP_VERSION:
        return { appVersion: this.config.appVersion };

      case OnRampDataKeys.THEME:
        return { theme: this.config.theme };

      case OnRampDataKeys.COUNTRY_CODE:
        return { countryCode: this.config.countryCode };

      default:
        console.warn(`Unknown data key: ${key}`);
        return { error: `Unknown data key: ${key}` };
    }
  }

  /**
   * Handle transaction token requests
   */
  private async handleTransactionTokenRequest(): Promise<any> {
    return this.getTransactionToken();
  }

  /**
   * Handle token data requests
   */
  private async handleTokenDataRequest(): Promise<any> {
    return this.getTokenData();
  }

  /**
   * Handle remote config requests
   */
  private async handleRemoteConfigRequest(request: any): Promise<any> {
    const { key } = request.params || {};
    return this.getRemoteConfigValue(key);
  }

  /**
   * Handle permission requests
   */
  private async handlePermissionRequest(request: any): Promise<any> {
    const { permissions } = request.params || {};
    const results: Record<string, string> = {};

    for (const permission of permissions || []) {
      switch (permission) {
        case 'camera':
          results.camera = (await this.requestCameraPermission())
            ? 'granted'
            : 'denied';
          break;
        default:
          results[permission] = 'unsupported';
      }
    }

    return { permissions: results };
  }

  /**
   * Handle camera permission requests
   */
  private async handleCameraPermissionRequest(): Promise<any> {
    const granted = await this.requestCameraPermission();
    return { status: granted ? 'granted' : 'denied' };
  }

  /**
   * Handle URL opening requests
   */
  private async handleOpenUrlRequest(request: any): Promise<any> {
    const { url } = request.params || {};

    if (!url || typeof url !== 'string') {
      return { error: 'Invalid URL' };
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return { status: 'opened' };
      } else {
        return { error: 'URL not supported' };
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
      return { error: 'Failed to open URL' };
    }
  }

  /**
   * Handle app configuration requests
   */
  private async handleAppConfigRequest(): Promise<any> {
    return {
      config: {
        theme: this.config.theme,
        countryCode: this.config.countryCode,
        appVersion: this.config.appVersion,
        onRampEnabled: this.config.onRampEnabled,
        timeout: this.config.timeout,
      },
    };
  }

  /**
   * Get transaction token
   */
  private async getTransactionToken(): Promise<any> {
    try {
        console.log('Generating transaction token...');
      const token = await generateTransactionToken(this.oktoClient);
      return { transactionToken: token };
    } catch (error) {
      console.error('Error getting transaction token:', error);
      return { error: 'Failed to get transaction token' };
    }
  }

  private async getTokenData(): Promise<any> {
    try {
        console.log('Fetching supported tokens for onramp...');
      const supportedTokens = await getSupportedRampTokens(
        this.oktoClient,
        'IN',
        'onramp',
      );
      const onrampTokens = supportedTokens.onrampTokens;
      return { onrampTokens };
    } catch (error) {
      console.error('Error fetching onramp tokens:', error);
      return { error: 'Failed to fetch onramp tokens' };
    }
  }

  /**
   * Get remote config value
   */
  private async getRemoteConfigValue(key: string): Promise<any> {
    try {
      const configValue = await this.remoteConfig.getValue(key);
      return { [key]: configValue.stringValue };
    } catch (error) {
      console.error('Error getting remote config:', error);
      return { error: 'Failed to get remote config' };
    }
  }

  /**
   * Get user email
   */
  private async getUserEmail(): Promise<{ email: string }> {
    try {
      //   const email = this.oktoClient.session?.email;
      //   if (email) {
      //     return { email };
      //   }

      // If email not found, return empty string
      return { email: '' };
    } catch (error) {
      console.error('Error getting user email:', error);
      return { email: '' };
    }
  }

  /**
   * Get wallet address
   */
  private async getWalletAddress(): Promise<any> {
    try {
      const wallet = this.oktoClient.userSWA;
      return { walletAddress: wallet };
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return { error: 'Failed to get wallet address' };
    }
  }

  /**
   * Request camera permission
   */
  private async requestCameraPermission(): Promise<boolean> {
    try {
      let result: string;

      if (Platform.OS === 'android') {
        result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'OnRamp needs camera access for identity verification',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        result = await request(PERMISSIONS.IOS.CAMERA);
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Camera permission request failed:', error);
      return false;
    }
  }
}
