export interface OnrampCallbacks {
  onSuccess?: (data?: any) => void;
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

export interface WebEventModel {
  event: string;
  id?: string;
  request?: Record<string, any>;
  response?: Record<string, any>;
}

// WebEvents enum matching Flutter implementation
export enum WebEvent {
  ANALYTICS = 'analytics',
  CLOSE = 'close',
  URL = 'url',
  REQUEST_PERMISSION = 'requestPermission',
  REQUEST_PERMISSION_ACK = 'requestPermission_ack',
  DATA = 'data',
}

// WebKeys matching Flutter implementation
export const WebKeys = {
  REMOTE_CONFIG: 'remote-config',
  TRANSACTION_ID: 'payToken',
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
    onClose: () => void;
    onSuccess?: (data?: any) => void;
    onError?: (error: string) => void;
    onProgress?: (progress: number) => void;
  };
};
