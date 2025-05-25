// onRampService.js
import { OnrampRemoteConfig } from '../onRamp/onRampRemoteConfig.js';
import { OktoClient } from '@okto_web3/core-js-sdk';
import {
  generateTransactionToken,
  getSupportedRampTokens,
} from '@okto_web3/core-js-sdk/explorer';
import type { OnrampConfig, OnRampToken } from './types.js';

export class OnRampService {
  private remoteConfig: OnrampRemoteConfig;
  private oktoClient: OktoClient;
  private config: OnrampConfig;
  private onRampToken?: OnRampToken;

  constructor(config: Partial<OnrampConfig> = {}, oktoClient: OktoClient, onRampToken?: OnRampToken) {
    this.remoteConfig = OnrampRemoteConfig.getInstance();
    this.oktoClient = oktoClient;
    this.onRampToken = onRampToken;
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
      console.log('Generating transaction token...');
      return await generateTransactionToken(this.oktoClient);
    } catch (error) {
      console.error('Error getting transaction token:', error);
      throw error;
    }
  }

  async getTokenData(tokenId?: string): Promise<any> {
    try {
      console.log('Fetching token data for tokenId:', tokenId);
      
      // If we have a specific onRampToken for this tokenId, return it
      if (this.onRampToken && tokenId === this.onRampToken.whitelistedToken.tokenId) {
        return this.createTokenAckJson(this.onRampToken);
      }
      
      // Otherwise fetch from API
      console.log('Fetching supported tokens for onramp...');
      const supportedTokens = await getSupportedRampTokens(
        this.oktoClient,
        'IN',
        'onramp',
      );
      
      if (tokenId) {
        // Find specific token
        const token = supportedTokens.onrampTokens?.find(
          (t: any) => t.id === tokenId || t.tokenId === tokenId
        );
        return token ? this.createTokenAckJson({ whitelistedToken: token }) : null;
      }
      
      return supportedTokens.onrampTokens;
    } catch (error) {
      console.error('Error fetching token data:', error);
      throw error;
    }
  }

  // Match Flutter's OnRampToken.ackJson() method
  private createTokenAckJson(onRampToken: OnRampToken): any {
    const { whitelistedToken, token } = onRampToken;
    
    return {
      id: whitelistedToken.tokenId,
      name: whitelistedToken.name,
      symbol: whitelistedToken.shortName,
      iconUrl: whitelistedToken.logo,
      networkId: whitelistedToken.networkId,
      networkName: whitelistedToken.networkName,
      address: whitelistedToken.address,
      balance: token?.balance,
      precision: token?.precision,
      chainId: whitelistedToken.chainId
      // lockedBalance: token?.holdingsPriceUsdt  // Commented like in Flutter
    };
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

  // Method to set the onRampToken (useful if you need to update it)
  setOnRampToken(onRampToken: OnRampToken): void {
    this.onRampToken = onRampToken;
  }
}