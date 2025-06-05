import { Constants } from '@/utils/constants.js';
import type { EnvConfig } from './types.js';

export const stagingEnvConfig: EnvConfig = {
  gatewayBaseUrl: 'https://okto-gateway.oktostage.com',
  bffBaseUrl: 'https://3p-bff.oktostage.com',
  paymasterAddress: Constants.ENV_CONFIG.STAGING.PAYMASTER_ADDRESS,
  jobManagerAddress: Constants.ENV_CONFIG.STAGING.JOB_MANAGER_ADDRESS,
  entryPointAddress: Constants.ENV_CONFIG.STAGING.ENTRYPOINT_CONTRACT_ADDRESS,
  chainId: Constants.ENV_CONFIG.STAGING.CHAIN_ID,
  authPageUrl: Constants.ENV_CONFIG.STAGING.AUTH_PAGE_URL,
  authRedirectUrl: Constants.ENV_CONFIG.STAGING.AUTH_REDIRECT_URL,
  signMessageMpcThreshold:
    Constants.ENV_CONFIG.STAGING.SIGN_MESSAGE_MPC_THRESHOLD,
  onrampUrl: Constants.ENV_CONFIG.STAGING.ON_RAMP_URL,
};

export const sandboxEnvConfig: EnvConfig = {
  gatewayBaseUrl: 'https://sandbox-okto-gateway.oktostage.com',
  bffBaseUrl: 'https://sandbox-api.okto.tech',
  paymasterAddress: Constants.ENV_CONFIG.SANDBOX.PAYMASTER_ADDRESS,
  jobManagerAddress: Constants.ENV_CONFIG.SANDBOX.JOB_MANAGER_ADDRESS,
  entryPointAddress: Constants.ENV_CONFIG.SANDBOX.ENTRYPOINT_CONTRACT_ADDRESS,
  chainId: Constants.ENV_CONFIG.SANDBOX.CHAIN_ID,
  authPageUrl: Constants.ENV_CONFIG.SANDBOX.AUTH_PAGE_URL,
  authRedirectUrl: Constants.ENV_CONFIG.SANDBOX.AUTH_REDIRECT_URL,
  signMessageMpcThreshold:
    Constants.ENV_CONFIG.SANDBOX.SIGN_MESSAGE_MPC_THRESHOLD,
  onrampUrl: Constants.ENV_CONFIG.SANDBOX.ON_RAMP_URL,
};

export const productionEnvConfig: EnvConfig = {
  gatewayBaseUrl: 'https://okto-gateway.okto.tech',
  bffBaseUrl: 'https://apigw.okto.tech',
  paymasterAddress: Constants.ENV_CONFIG.PRODUCTION.PAYMASTER_ADDRESS,
  jobManagerAddress: Constants.ENV_CONFIG.PRODUCTION.JOB_MANAGER_ADDRESS,
  entryPointAddress:
    Constants.ENV_CONFIG.PRODUCTION.ENTRYPOINT_CONTRACT_ADDRESS,
  chainId: Constants.ENV_CONFIG.PRODUCTION.CHAIN_ID,
  authPageUrl: Constants.ENV_CONFIG.PRODUCTION.AUTH_PAGE_URL,
  authRedirectUrl: Constants.ENV_CONFIG.PRODUCTION.AUTH_REDIRECT_URL,
  signMessageMpcThreshold:
    Constants.ENV_CONFIG.PRODUCTION.SIGN_MESSAGE_MPC_THRESHOLD,
};
