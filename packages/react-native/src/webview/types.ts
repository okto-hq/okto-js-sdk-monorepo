export type MessageMethod = 'okto_sdk_login';

export type AuthProvider =
  | 'whatsapp'
  | 'google'
  | 'telegram'
  | 'email'
  | 'apple';

export type LoginRequestType =
  | 'request_otp'
  | 'verify_otp'
  | 'resend_otp'
  | 'paste_otp'
  | 'ui_config'
  | 'close_webview';

export interface WebViewRequest {
  id: string;
  method: MessageMethod;
  data: LoginRequestData;
}

export interface LoginRequestData {
  provider?: AuthProvider;
  whatsapp_number?: string;
  email?: string;
  telegram_id?: string;
  type?: LoginRequestType;
  otp?: string;
  token?: string;
  [key: string]: string | AuthProvider | LoginRequestType | undefined;
}

export interface WebViewResponse {
  id: string;
  method: MessageMethod;
  data: {
    provider?: AuthProvider;
    whatsapp_number?: string;
    email?: string;
    telegram_id?: string;
    otp?: string;
    token?: string;
    message?: string;
    config?: UIConfig;
    type?: LoginRequestType;
    [key: string]:
      | string
      | AuthProvider
      | LoginRequestType
      | UIConfig
      | undefined;
  };
  error?: string;
}

export type WebViewParamList = {
  WebViewScreen: {
    url: string;
    title?: string;
    provider?: AuthProvider;
    redirectUrl: string;
    uiConfig?: UIConfig;
    initialData?: Record<string, string | number | boolean>;
    onAuthComplete?: (data: Record<string, string | number | boolean>) => void;
    clientConfig: {
      environment: string;
      clientPrivateKey: string;
      clientSWA: string;
    };
  };
};

export interface UIConfig {
  version: string;
  appearance?: {
    themeName?: string;
    theme?: Record<string, string>;
  };
  vendor?: {
    name?: string;
    logo?: string;
  };
  loginOptions?: {
    socialLogins?: Array<{
      type: string;
      position: number;
    }>;
    otpLoginOptions?: Array<{
      type: string;
      position: number;
    }>;
    externalWallets?: Array<{
      type: string;
      position: number;
      metadata?: Record<string, unknown>;
    }>;
  };
}

export interface AuthResult {
  success: boolean;
  token?: string;
  message?: string;
  error?: string;
  userData?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

export type WebViewEventType = 'request' | 'response' | 'info' | 'error';

export interface WebViewBridgeMessage {
  type: WebViewEventType;
  payload: WebViewRequest | WebViewResponse;
}
