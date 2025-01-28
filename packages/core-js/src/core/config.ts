import type { EnvConfig } from './types.js';

export const sandboxEnvConfig: EnvConfig = {
  gatewayBaseUrl: 'https://okto-gateway.oktostage.com',
  bffBaseUrl: 'https://apigw.oktostage.com',
  paymasterAddress: '0x9b34131837d534cD199c0b8FdD8347c05E21A2D8',
};

export const productionEnvConfig: EnvConfig = {
  gatewayBaseUrl: 'https://okto-gateway.okto.tech',
  bffBaseUrl: 'https://apigw.okto.tech',
  paymasterAddress: '0x9b34131837d534cD199c0b8FdD8347c05E21A2D8',
};
