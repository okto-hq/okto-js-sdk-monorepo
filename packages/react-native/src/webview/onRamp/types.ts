import type { OktoClient } from '@okto_web3/core-js-sdk';

export interface OnrampCallbacks {
  onSuccess?: (data?: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  onProgress?: (progress: number) => void;
}

export interface OnrampConfig {
  onRampEnabled: boolean;
  theme: 'light' | 'dark';
  countryCode: string;
  appVersion: string;
  timeout: number;
  maxRetries: number;
}

export enum WebEvent {
  ANALYTICS = 'analytics',
  CLOSE = 'close',
  URL = 'url',
  REQUEST_PERMISSION = 'requestPermission',
  REQUEST_PERMISSION_ACK = 'requestPermission_ack',
  DATA = 'data',
}

export type OnRampToken = {
  id: string;
  name: string;
  symbol: string;
  iconUrl: string;
  networkId: string;
  networkName: string;
  address: string;
  balance?: string;
  precision?: string | number;
  chainId: string | number;
};

export const WebKeys = {
  REMOTE_CONFIG: 'remote-config',
  TRANSACTION_ID: 'payToken',
  KEY: 'key',
  SOURCE: 'source',
  FORWARD_TO_ROUTE: 'forwardToRoute',
  TOKEN_DATA: 'tokenData',
  ORDER_SUCCESS: 'orderSuccessBottomSheet',
  ORDER_FAILURE: 'orderFailureBottomSheet',
} as const;

export type OnRampParamList = {
  OnRampScreen: {
    url: string;
    tokenId: string;
    oktoClient: OktoClient;
    onClose: () => void;
    onSuccess?: (data?: string) => void;
    onError?: (error: string) => void;
    onProgress?: (progress: number) => void;
  };
};

export type OnRampWebViewParams = {
  control?: boolean;
  key?: string;
  source?: string;
  url?: string;
  data?: Record<string, unknown>;
  type?: string;
  permissionType?: 'camera' | 'microphone';
  [key: string]: unknown;
};

export type OnRampWebViewMessage = {
  type: string;
  params?: OnRampWebViewParams;
  id?: string;
  response?: Record<string, unknown>;
  channel?: string;
  detail?: {
    paymentStatus?: string;
    [key: string]: unknown;
  };
};

export type OnRampWebViewResponse = {
  type: string;
  response: unknown;
  source: string;
  id: string;
};

export const SOURCE_NAME = 'okto_web';
