// src/types/webview.ts

export enum MessageStatus {
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export enum ProviderType {
  GOOGLE = 'google',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  PHONE = 'phone'
}

export enum WebViewMethodType {
  LOGIN = 'okto_sdk_login',
  UI_STATE_UPDATE = 'okto_ui_state_update'
}

export enum UIState {
  OPENED = 'opened',
  CLOSED = 'closed',
  MINIMIZED = 'minimized'
}

export interface HostRequest {
  id: string;
  method: WebViewMethodType;
  data: {
    provider?: ProviderType;
    state?: UIState;
    [key: string]: any;
  };
}

export interface HostResponse {
  id: string;
  method: WebViewMethodType;
  data: {
    status: MessageStatus;
    message?: string;
    [key: string]: any;
  };
}

export interface WebViewConfig {
  url: string;
  headers?: Record<string, string>;
  onClose?: () => void;
}

export type WebViewResponseCallback = (response: HostResponse) => void;