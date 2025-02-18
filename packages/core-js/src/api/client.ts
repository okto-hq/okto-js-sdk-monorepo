import type OktoClient from '@/core/index.js';
import { RpcError } from '@/errors/index.js';
import { convertKeysToCamelCase } from '@/utils/convertToCamelCase.js';
import axios, { AxiosError } from 'axios';
import { BaseError } from 'viem';
import { createLoggingInterceptor } from './logger.js';

function getGatewayClient(oc: OktoClient) {
  const client = axios.create({
    baseURL: oc.env.gatewayBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    async (config) => {
      if (config.headers['Skip-Authorization'] == 'true') {
        config.headers.delete('Skip-Authorization');
        return config;
      }
      config.headers.setAuthorization(
        `Bearer ${await oc.getAuthorizationToken()}`,
      );
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

  if (oc.isDev) {
    client.interceptors.response.use(...createLoggingInterceptor());
  }

  return client;
}

function getBffClient(oc: OktoClient) {
  const client = axios.create({
    baseURL: oc.env.bffBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    async (config) => {
      config.headers.setAuthorization(
        `Bearer ${await oc.getAuthorizationToken()}`,
      );
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

  if (oc.isDev) {
    client.interceptors.response.use(...createLoggingInterceptor());
  }

  // axiosRetry(client, {
  //   retries: 3,
  //   retryDelay: axiosRetry.exponentialDelay,
  // });

  return client;
}

export { getBffClient, getGatewayClient };
