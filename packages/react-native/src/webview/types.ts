// types.ts
export type MessageMethod = 'okto_sdk_login';

export type AuthProvider = 'whatsapp' | 'google' | 'telegram' | 'email';

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
    type?: LoginRequestType;
    config?: UIConfig;
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
    initialData?: Record<string, string | number | boolean>;
    onAuthComplete?: (data: Record<string, string | number | boolean>) => void;
    clientConfig: {
      environment: string;
      clientPrivateKey: string;
      clientSWA: string;
    };
    uiConfig?: UIConfig; // Added for UI configuration
  };
};

// Define UI Configuration types
export interface UIConfigTheme {
  '--okto-body-background': string;
  '--okto-body-color-tertiary': string;
  '--okto-accent-color': string;
  '--okto-button-font-weight': number;
  '--okto-border-color': string;
  '--okto-stroke-divider': string;
  '--okto-font-family': string;
  '--okto-rounded-sm': string;
  '--okto-rounded-md': string;
  '--okto-rounded-lg': string;
  '--okto-rounded-xl': string;
  '--okto-rounded-full': string;
  '--okto-success-color': string;
  '--okto-warning-color': string;
  '--okto-error-color': string;
  '--okto-text-primary': string;
  '--okto-text-secondary': string;
  '--okto-background-surface': string;
}

export interface UIConfig {
  version: string;
  appearance: {
    themeName: 'light' | 'dark';
    theme: UIConfigTheme;
  };
  vendor: {
    name: string;
    logo: string;
  };
  loginOptions: {
    socialLogins: Array<{
      type: string;
      position: number;
    }>;
    otpLoginOptions: Array<{
      type: string;
      position: number;
    }>;
    externalWallets: Array<{
      type: string;
      position: number;
      metadata?: {
        iconUrl?: string;
        installed?: boolean;
        [key: string]: unknown;
      };
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
