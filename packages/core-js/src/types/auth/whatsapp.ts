interface BaseRequestData {
  whatsapp_number: string;
  country_short_name: string;
  client_swa: string;
  timestamp: number;
}

// Request models
export interface WhatsAppSendOtpRequest {
  data: BaseRequestData;
  client_signature: string;
  type: string;
}

export interface WhatsAppResendOtpRequest {
  data: BaseRequestData & {
    token: string;
  };
  client_signature: string;
  type: string;
}

export interface WhatsAppVerifyOtpRequest {
  data: BaseRequestData & {
    token: string;
    otp: string;
  };
  client_signature: string;
  type: string;
}

// Response models
export interface WhatsAppSendOtpResponse {
  status: string;
  message: string;
  code: number;
  token: string;
}

export interface WhatsAppResendOtpResponse {
  status: string;
  message: string;
  code: number;
  token: string;
}

export interface WhatsAppVerifyOtpResponse {
  authToken: string;
  message: string;
  refreshAuthToken: string;
  deviceToken: string;
}
