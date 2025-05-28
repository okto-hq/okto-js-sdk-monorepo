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

// WebEvents enum matching Flutter implementation
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

// WebKeys matching Flutter implementation
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
    oktoClient: any;
    onClose: () => void;
    onSuccess?: (data?: any) => void;
    onError?: (error: string) => void;
    onProgress?: (progress: number) => void;
  };
};
