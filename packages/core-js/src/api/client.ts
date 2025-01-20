import { globalConfig } from '@/config/index.js';
import { RpcError } from '@/errors/index.js';
import { getAuthorizationToken } from '@/utils/auth.js';
import { convertKeysToCamelCase } from '@/utils/convertToCamelCase.js';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { BaseError } from 'viem';

function getGatewayClient() {
  const client = axios.create({
    baseURL: globalConfig.env.gatewayBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      if (config.headers['Skip-Authorization'] == 'true') {
        return config;
      }
      config.headers.setAuthorization(`Bearer ${getAuthorizationToken()}`);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response) => {
      if (response.data) {
        response.data = convertKeysToCamelCase(response.data);
      }
      return response;
    },
    (error) => {
      if (error instanceof AxiosError) {
        if (error instanceof BaseError) {
          throw new RpcError(
            error.response?.data.error.code || -1,
            error.response?.data.error.message,
            error.response?.data.error.data,
          );
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

function getBffClient() {
  const client = axios.create({
    baseURL: globalConfig.env.bffBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      config.headers.setAuthorization(`Bearer ${getAuthorizationToken()}`);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response) => {
      if (response.data) {
        response.data = convertKeysToCamelCase(response.data);
      }
      return response;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
  });

  return client;
}

export { getBffClient, getGatewayClient };
