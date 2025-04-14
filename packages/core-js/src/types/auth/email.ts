interface BaseEmailRequestData {
  email: string;
  clientSWA: string;
  timestamp: number;
}

// Request models
export interface EmailSendOtpRequest {
  data: BaseEmailRequestData;
  clientSign: string;
}

export interface EmailResendOtpRequest {
  data: BaseEmailRequestData & {
    token: string;
  };
  clientSign: string;
}

export interface EmailVerifyOtpRequest {
  data: BaseEmailRequestData & {
    token: string;
    otp: string;
  };
  clientSign: string;
}

// Response models
export interface EmailSendOtpResponse {
  status: string;
  message: string;
  code: number;
  token: string;
  trace_id: string;
}

export interface EmailResendOtpResponse {
  status: string;
  message: string;
  code: number;
  token: string;
  trace_id: string;
}

export interface EmailVerifyOtpResponse {
  auth_token: string;
  message: string;
  refresh_auth_token: string;
  device_token: string;
  trace_id: string;
}
