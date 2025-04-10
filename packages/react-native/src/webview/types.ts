// types.ts
export type MessageMethod =
  | 'okto_sdk_login'
  | 'okto_ui_state_update'
  // Add other methods as needed
  | string;

export interface WebViewRequest {
  id: string;
  method: MessageMethod;
  data: Record<string, any>;
}

export interface WebViewResponse {
  id: string;
  method: MessageMethod;
  data: {
    provider: string;
    whatsapp_number?: string;
    token?: string;
    [key: string]: any;
  };
  error?: string;
}

// Navigation param list
export type WebViewParamList = {
  WebViewScreen: {
    url: string;
    title?: string;
  };
};
