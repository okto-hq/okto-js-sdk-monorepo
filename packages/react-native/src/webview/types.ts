export type MessageMethod = 'okto_sdk_login';

export type AuthProvider = 'whatsapp' | 'google' | 'telegram' | 'email';

export type LoginRequestType =
  | 'request_otp'
  | 'verify_otp'
  | 'resend_otp'
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
  [key: string]: any;
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
    [key: string]: any;
  };
  error?: string;
}

export type WebViewParamList = {
  WebViewScreen: {
    url: string;
    title?: string;
    provider?: AuthProvider;
    initialData?: Record<string, any>;
    onAuthComplete?: (data: Record<string, any>) => void;
    clientConfig: {
      environment: string;
      clientPrivateKey: string;
      clientSWA: string;
    };
  };
};

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
    [key: string]: any;
  };
}

export type WebViewEventType = 'request' | 'response' | 'info' | 'error';

export interface WebViewBridgeMessage {
  type: WebViewEventType;
  payload: WebViewRequest | WebViewResponse;
}
