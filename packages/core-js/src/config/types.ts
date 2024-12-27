export type Env = 'sandbox' | 'production';

export interface EnvConfig {
  gatewayBaseUrl: string;
  bffBaseUrl: string;
}

export interface AuthOptions {
  userSessionKey: string;
}
