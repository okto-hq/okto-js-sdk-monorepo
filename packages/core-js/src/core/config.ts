import type { EnvConfig } from './types.js';

export const sandboxEnvConfig: EnvConfig = {
  gatewayBaseUrl: 'https://okto-gateway.oktostage.com',
  bffBaseUrl: 'https://apigw.oktostage.com',
  paymasterAddress: '0x0871051BfF8C7041c985dEddFA8eF63d23AD3Fa0',
  jobManagerAddress: '0xED3D17cae886e008D325Ad7c34F3bdE030B80c2E',
  chainId: 24879,
};

export const productionEnvConfig: EnvConfig = {
  gatewayBaseUrl: 'https://okto-gateway.okto.tech',
  bffBaseUrl: 'https://apigw.okto.tech',
  paymasterAddress: '0x0871051BfF8C7041c985dEddFA8eF63d23AD3Fa0',
  jobManagerAddress: '0xED3D17cae886e008D325Ad7c34F3bdE030B80c2E',
  chainId: 24879,
};
