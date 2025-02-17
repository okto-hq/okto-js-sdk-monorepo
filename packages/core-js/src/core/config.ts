import { Constants } from '@/utils/constants.js';
import type { EnvConfig } from './types.js';

export const sandboxEnvConfig: EnvConfig = {
  gatewayBaseUrl: 'https://okto-gateway.oktostage.com',
  bffBaseUrl: 'https://apigw.oktostage.com',
  paymasterAddress: Constants.ENV_CONFIG.SANDBOX.PAYMASTER_ADDRESS,
  jobManagerAddress: Constants.ENV_CONFIG.SANDBOX.JOB_MANAGER_ADDRESS,
  chainId: Constants.ENV_CONFIG.SANDBOX.CHAIN_ID,
};

export const productionEnvConfig: EnvConfig = {
  gatewayBaseUrl: 'https://okto-gateway.okto.tech',
  bffBaseUrl: 'https://apigw.okto.tech',
  paymasterAddress: Constants.ENV_CONFIG.PRODUCTION.PAYMASTER_ADDRESS,
  jobManagerAddress: Constants.ENV_CONFIG.PRODUCTION.JOB_MANAGER_ADDRESS,
  chainId: Constants.ENV_CONFIG.PRODUCTION.CHAIN_ID,
};
