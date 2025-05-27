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

// Channel-based communication types
export interface ChannelMessage {
  id: string;
  type: string;
  params?: Record<string, any>;
  response?: Record<string, any>;
  status?: 'success' | 'loading' | 'error';
  message?: string;
  error?: string;
}

// Request/Response channel types
export interface DataRequest {
  id: string;
  type: 'data';
  params: {
    key: string;
    source: string;
  };
}

export interface DataResponse {
  id: string;
  type: 'data';
  response: Record<string, any>;
  status: 'success' | 'loading' | 'error';
  message?: string;
  error?: string;
}

// Permission request types
export interface PermissionRequest {
  id: string;
  type: 'requestPermission';
  params: {
    data: {
      camera?: boolean;
      microphone?: boolean;
      [key: string]: boolean | undefined;
    };
  };
}

export interface PermissionResponse {
  permission: string;
  status: 'granted' | 'denied' | 'blocked' | 'limited' | 'unavailable' | 'error';
  granted: boolean;
  message?: string;
}

// Launch channel event types
export interface LaunchEvent {
  type: 'close' | 'url' | 'onRampCompleted';
  params?: Record<string, any>;
}

export interface CloseEvent extends LaunchEvent {
  type: 'close';
  params?: {
    forwardToRoute?: string;
    status?: 'success' | 'failure' | string;
  };
}

export interface UrlEvent extends LaunchEvent {
  type: 'url';
  params: {
    url: string;
    openApp?: boolean;
    type?: string;
    link?: string;
    [key: string]: any;
  };
}

export interface OnRampCompletedEvent extends LaunchEvent {
  type: 'onRampCompleted';
  params: {
    orderId: string;
  };
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

// Constants for request keys and sources
export const RequestKeys = {
  TOKEN_DATA: 'tokenData',
  PAY_TOKEN: 'payToken',
  TRANSACTION_ID: 'transactionId', // Legacy support
} as const;

export const RequestSources = {
  REMOTE_CONFIG: 'remote-config',
} as const;

// Route configuration for close events (Okto-specific)
export const CloseRoutes = {
  ORDER_SUCCESS: 'OrderSuccessBottomSheet',
  ORDER_FAILURE: 'OrderFailureBottomSheet',
  ACTIVITY_TRANSFER: 'ActivityTransfer',
} as const;

export type OnRampParamList = {
  OnRampScreen: {
    url: string;
    tokenId: string;
    oktoClient: any;
    onClose: () => void;
    onSuccess?: (data?: string) => void;
    onError?: (error: string) => void;
    onProgress?: (progress: number) => void;
  };
};