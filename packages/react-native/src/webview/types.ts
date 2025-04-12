// ==============================
// types.ts
// Type definitions for WebView communication
// ==============================

/**
 * Defines the supported authentication methods
 */
export type MessageMethod = 'okto_sdk_login';

/**
 * Supported authentication providers
 */
export type AuthProvider = 'whatsapp' | 'gauth' | 'telegram' | 'email';

/**
 * Navigation routes enum to avoid hardcoded screen names
 */
export enum Routes {
  AUTH_WEBVIEW = 'AuthWebViewScreen',
}

/**
 * Types of login requests that can be processed
 */
export type LoginRequestType =
  | 'request_otp'
  | 'verify_otp'
  | 'resend_otp'
  | 'close_webview';

/**
 * Structure of requests coming from WebView
 */
export interface WebViewRequest {
  id: string;
  method: MessageMethod;
  data: LoginRequestData;
}

/**
 * Data structure for login requests
 */
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

/**
 * Structure of responses sent back to WebView
 */
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

/**
 * Navigation parameters for WebView screen
 */
export type WebViewParamList = {
  WebViewScreen: {
    url: string;
    title?: string;
    provider?: AuthProvider;
    initialData?: Record<string, any>;
    onAuthComplete?: (data: Record<string, any>) => void;
  };
};

/**
 * Authentication result structure
 */
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

/**
 * Types of events that can be sent through the WebView bridge
 */
export type WebViewEventType = 'request' | 'response' | 'info' | 'error';

/**
 * Message structure for WebView bridge communication
 */
export interface WebViewBridgeMessage {
  type: WebViewEventType;
  payload: WebViewRequest | WebViewResponse;
}
