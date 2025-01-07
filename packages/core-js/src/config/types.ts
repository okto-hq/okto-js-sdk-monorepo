export type Env = 'sandbox' | 'production';

export interface EnvConfig {
  gatewayBaseUrl: string;
  bffBaseUrl: string;
  paymasterAddress: string;
}

export interface AuthOptions {
  sessionPubKey?: string;
  sessionPrivKey?: string;
  vendorPubKey: string;
  vendorPrivKey: string;
}
