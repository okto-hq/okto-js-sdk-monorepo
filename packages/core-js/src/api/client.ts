import { globalConfig } from '@/config/index.js';
import { getAuthorizationToken } from '@/utils/auth.js';
import { convertKeysToCamelCase } from '@/utils/convertToCamelCase.js';
import axios, { type AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';

function getGatewayClient() {
  const client = axios.create({
    baseURL: globalConfig.env.gatewayBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      if (config.headers && config.headers['Skip-Authorization'] === 'true') {
        logCurlCommand(config);
        return config;
      }

      const token = getAuthorizationToken();
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      logCurlCommand(config, token);
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

  return client;
}

function logCurlCommand(config: AxiosRequestConfig, token?: string): void {
  const method = config.method?.toUpperCase() || 'GET';
  const url = `${config.baseURL || ''}${config.url || ''}`;

  const headers = Object.entries(config.headers || {})
    .filter(([key, value]) => value) // Filter out empty headers
    .map(([key, value]) => `-H "${key}: ${value}"`)
    .join(' ');

  const data =
    config.data && typeof config.data === 'object'
      ? `--data '${JSON.stringify(config.data)}'`
      : config.data
        ? `--data '${config.data}'`
        : '';

  const authHeader = token ? `-H "Authorization: Bearer ${token}"` : '';

  const curlCommand =
    `curl -X ${method} "${url}" ${headers} ${authHeader} ${data}`.trim();

  console.log(curlCommand);
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
      const token = getAuthorizationToken();
      console.log(`karan is here in curl ${token}`);
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`Karan is here in bff request abbea`);
      logCurlCommand(config);
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
