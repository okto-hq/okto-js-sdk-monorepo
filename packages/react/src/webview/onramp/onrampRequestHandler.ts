import type { WebViewManager } from '../webViewManager.js';
import type { WebViewRequestHandler } from '../types.js';
import type { OktoClient } from 'src/core/index.js';
import { OKTO_REMOTE_CONFIG } from './okto_remote_config.js';
import { getSupportedRampTokens } from '@okto_web3/core-js-sdk/explorer';

export class OnrampRequestHandler {
  private webViewManager: WebViewManager;
  private oktoClient: OktoClient;

  constructor(webViewManager: WebViewManager, oktoClient: OktoClient) {
    this.webViewManager = webViewManager;
    this.oktoClient = oktoClient;
  }

  public handleRequest: WebViewRequestHandler = async (requestData: {
    id?: string;
    type?: string;
    params?: { [key: string]: unknown };
  }) => {
    if (!requestData || typeof requestData !== 'object') {
      throw new Error('Invalid request data');
    }

    const { id, type } = requestData;
    console.log('Onramp request received:', id, requestData);

    const baseResponse = { id, type };
    switch (type) {
      case 'data':
        await this.handleDataRequest(requestData, baseResponse);
        break;
      case 'requestPermission':
        await this.handlePermissionRequest(requestData, baseResponse);
        break;
      case 'close':
        this.webViewManager.closeWebView();
        break;
      default:
        console.warn('Unhandled onramp request type:', type);
    }
  };

  private async handleDataRequest(
    requestData: { id?: string; params?: Record<string, unknown> },
    baseResponse: { id?: string; type?: string },
  ) {
    const { id, params } = requestData;
    if (!params?.key) {
      console.warn('[OnrampRequestHandler] Data request missing key');
      return;
    }

    const key = params.key as string;
    const source = (params.source as string) || '';
    try {
      let result = '';

      if (source === 'remote-config') {
        result = this.getLocalRemoteConfigValue(key);
      } else {
        switch (key) {
          case 'transactionId':
            result = 'MockedTransactionToken';
            break;
          case 'tokenData': {
            const { onrampTokens } = await getSupportedRampTokens(
              this.oktoClient,
              'IN',
              'onramp',
            );
            const tokenData = onrampTokens.find(
              (token) => token.tokenId === id,
            );

            if (!tokenData) {
              console.warn(
                '[OnrampRequestHandler] Token data not found for USDC on Polygon',
              );
              return;
            }
            console.log(
              `[OnrampRequestHandler] Token data for ${id}:`,
              tokenData,
            );
            result = JSON.stringify({
              symbol: tokenData.shortName,
              networkName: tokenData.networkName,
              iconUrl: tokenData.logo,
              precision: tokenData.precision,
            });
            break;
          }
          default:
            console.warn(`[OnrampRequestHandler] Unknown data key: ${key}`);
            return;
        }
      }

      this.webViewManager.sendResponse(baseResponse.id ?? '', 'data', {
        response: { [key]: result },
        status: 'success',
        message: 'Data fetched successfully',
      });
    } catch (error) {
      this.webViewManager.sendErrorResponse(
        baseResponse.id ?? '',
        'data',
        requestData.params,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
  getLocalRemoteConfigValue(key: string): string {
    const param =
      OKTO_REMOTE_CONFIG?.parameters[
        key as keyof typeof OKTO_REMOTE_CONFIG.parameters
      ];
    if (!param) {
      console.warn(`[OnrampRequestHandler] No remote config found for ${key}`);
      return '';
    }
    const value = param.defaultValue?.value ?? '';
    const finalValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    console.log(
      `[OnrampRequestHandler] Remote config value for ${key}:`,
      finalValue,
    );
    return finalValue;
  }

  private async handlePermissionRequest(
    requestData: { id?: string; params?: Record<string, unknown> },
    baseResponse: { id?: string; type?: string },
  ) {
    if (!requestData.params?.data) {
      console.warn('[OnrampRequestHandler] Permission request missing data');
      return;
    }
    try {
      const requestedPermissions = requestData.params.data as string[];
      const results: Record<string, boolean> = {};

      for (const permission of requestedPermissions) {
        if (permission === 'camera') {
          // Example: request camera permission
          results[permission] = true; // Stubbed success
        }
      }

      this.webViewManager.sendResponse(
        baseResponse.id ?? '',
        'requestPermission',
        {
          response: results,
          status: 'success',
          message: 'Permissions granted',
        },
      );
    } catch (error) {
      this.webViewManager.sendErrorResponse(
        baseResponse.id ?? '',
        'requestPermission',
        requestData.params,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
