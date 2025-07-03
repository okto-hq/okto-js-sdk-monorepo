import type { WebViewManager } from '../webViewManager.js';
import type { WebViewRequestHandler } from '../types.js';
import type { OktoClient } from 'src/core/index.js';
import { OKTO_REMOTE_CONFIG } from './okto_remote_config.js';
import { getSupportedRampTokens } from '@okto_web3/core-js-sdk/explorer';
import { SOURCE_NAME } from '../constants.js';

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
      case 'analytics':
        if (!requestData.params?.name) {
          console.warn('[OnrampRequestHandler] Analytics request missing name');
          break;
        }
        try {
          const event = requestData.params.name as string;
          const properties = requestData.params.properties ?? {};
          console.log(
            `[OnrampRequestHandler] Analytics event: ${event}`,
            properties,
          );
          this.sendResponse(baseResponse.id ?? '', 'analytics', {
            success: true,
          });
        } catch (error) {
          this.webViewManager.sendErrorResponse(
            baseResponse.id ?? '',
            'analytics',
            requestData.params,
            error instanceof Error ? error.message : 'Unknown error',
          );
        }
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
                '[OnrampRequestHandler] Token data not found for requested ID',
              );
              return;
            }
            console.log(
              `[OnrampRequestHandler] Token data for ${id}:`,
              tokenData,
            );
            result = JSON.stringify({
              id: tokenData.tokenId,
              name: tokenData.name,
              symbol: tokenData.shortName,
              iconUrl: tokenData.logo,
              networkId: tokenData.networkId,
              networkName: tokenData.networkName,
              address: tokenData.address,
              precision: tokenData.precision,
              chainId: tokenData.chainId,
            });
            break;
          }
          default:
            console.warn(`[OnrampRequestHandler] Unknown data key: ${key}`);
            return;
        }
      }

      this.sendResponse(baseResponse.id ?? '', 'data', {
        [key]: result,
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
      const results: Record<
        string,
        { status: string; granted: boolean; message?: string }
      > = {};

      for (const permission of requestedPermissions) {
        if (permission === 'camera') {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            results[permission] = { status: 'granted', granted: true };
          } catch (err) {
            let message = 'Permission denied by user';
            if (err && typeof err === 'object' && 'message' in err) {
              message = (err as Error).message;
            }
            results[permission] = {
              status: 'denied',
              granted: false,
              message,
            };
          }
        } else if (permission === 'microphone') {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            results[permission] = { status: 'granted', granted: true };
          } catch (err) {
            let message = 'Permission denied by user';
            if (err && typeof err === 'object' && 'message' in err) {
              message = (err as Error).message;
            }
            results[permission] = {
              status: 'denied',
              granted: false,
              message,
            };
          }
        } else {
          results[permission] = {
            status: 'unavailable',
            granted: false,
            message: 'Permission not available',
          };
        }
      }

      this.sendResponse(baseResponse.id ?? '', 'requestPermission', results);
    } catch (error) {
      this.webViewManager.sendErrorResponse(
        baseResponse.id ?? '',
        'requestPermission',
        requestData.params,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  private sendResponse(
    id: string,
    type: string,
    response: Record<string, unknown>,
  ): void {
    this.webViewManager.sendOnRampResponse(id, {
      id,
      type,
      response,
      source: SOURCE_NAME,
    });
  }

  private getLocalRemoteConfigValue(key: string): string {
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
}
