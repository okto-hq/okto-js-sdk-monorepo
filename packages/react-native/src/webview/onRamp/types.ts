import type { OktoClient } from '@okto_web3/core-js-sdk';
import type { WhitelistedToken } from '@okto_web3/core-js-sdk/types';

export interface OnrampConfig {
  onRampEnabled: boolean;
  theme: 'light' | 'dark';
  countryCode: string;
  appVersion: string;
  timeout: number;
  maxRetries: number;
}

export interface OnRampScreenProps {
  url: string;
  tokenId: string;
  oktoClient: OktoClient;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export type OnRampParamList = {
  OnRampScreen: OnRampScreenProps;
};

export interface OnrampRequest {
  id: string;
  key:
    | 'transactionToken'
    | 'tokenData'
    | 'remoteConfig'
    | 'orderSuccess'
    | 'orderFailure';
  source?: string;
  data?: unknown;
}

export interface OnrampResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface OnrampCallbacks {
  onClose?: () => void;
  onSuccess?: (data?: unknown) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export interface OnRampToken {
  whitelistedToken: WhitelistedToken;
  tokenId: string;
  networkId: string;
}

// OnRamp specific constants
export const OnRampEvents = {
  // Data requests
  DATA_REQUEST: 'data',
  TRANSACTION_TOKEN: 'transactionToken',
  TOKEN_DATA: 'tokenData',
  REMOTE_CONFIG: 'remoteConfig',

  // Permission requests
  REQUEST_PERMISSIONS: 'requestPermissions',
  CAMERA_PERMISSION: 'cameraPermission',

  // Navigation events
  CLOSE: 'close',
  OPEN_URL: 'openUrl',

  // Order events
  ORDER_SUCCESS: 'orderSuccess',
  ORDER_FAILURE: 'orderFailure',
  ORDER_PROGRESS: 'orderProgress',

  // Authentication events
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',

  // Configuration events
  APP_CONFIG: 'appConfig',
  THEME_CONFIG: 'themeConfig',
} as const;

export const OnRampDataKeys = {
  TRANSACTION_TOKEN: 'transactionToken',
  TOKEN_DATA: 'tokenData',
  REMOTE_CONFIG: 'remoteConfig',
  USER_EMAIL: 'userEmail',
  WALLET_ADDRESS: 'walletAddress',
  NETWORK_ID: 'networkId',
  APP_VERSION: 'appVersion',
  THEME: 'theme',
  COUNTRY_CODE: 'countryCode',
} as const;
