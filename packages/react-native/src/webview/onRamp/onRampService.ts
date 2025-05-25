import { OnrampRemoteConfig } from '../onRamp/onRampRemoteConfig.js';
import { OktoClient } from '@okto_web3/core-js-sdk';
import {
  generateTransactionToken,
  getSupportedRampTokens,
} from '@okto_web3/core-js-sdk/explorer';
import type { OnrampConfig } from './types.js';

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

  async getTokenData(): Promise<any> {
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

  async getRemoteConfigValue(key: string): Promise<string> {
    try {
      const configValue = await this.remoteConfig.getValue(key);
      return configValue.stringValue || '';
    } catch (error) {
      console.error('Error getting remote config:', error);
      return '';
    }
  }

  getConfig(): OnrampConfig {
    return this.config;
  }
}
