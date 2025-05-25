// types.js
export interface OnrampCallbacks {
  onSuccess?: (data?: any) => void;
  onError?: (error: string) => void;
  onClose?: (forwardToRoute?: string) => void;
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

export interface WebEventModel {
  event: WebEvent;
  id?: string;
  request?: Record<string, any>;
  response?: any;
  source: string;
}

// WebEvents enum matching Flutter implementation exactly
export enum WebEvent {
  ANALYTICS = 'analytics',
  CLOSE = 'close',
  URL = 'url',
  REQUEST_PERMISSION = 'requestPermission',
  REQUEST_PERMISSION_ACK = 'requestPermission_ack',
  DATA = 'data',
}

// WebKeys matching Flutter implementation exactly
export const WebKeys = {
  REMOTE_CONFIG: 'remote-config',
  TRANSACTION_ID: 'transactionId', // Changed from 'payToken' to match Flutter
  KEY: 'key',
  SOURCE: 'source',
  FORWARD_TO_ROUTE: 'forwardToRoute',
  TOKEN_DATA: 'tokenData',
} as const;

export type OnRampParamList = {
  OnRampScreen: {
    url: string;
    tokenId: string;
    oktoClient: any;
    onClose: (forwardToRoute?: string) => void;
    onSuccess?: (data?: any) => void;
    onError?: (error: string) => void;
    onProgress?: (progress: number) => void;
  };
};

export interface WhitelistedToken {
  tokenId: string;
  name: string;
  shortName: string;
  logo: string;
  // image: string;
  networkId: string;
  networkName: string;
  address: string;
  chainId: string | number;
  precision?: number;
}

export interface Token {
  balance?: string;
  precision?: number;
  holdingsPriceUsdt?: string;
}

export interface OnRampToken {
  whitelistedToken: WhitelistedToken;
  token?: Token;
}