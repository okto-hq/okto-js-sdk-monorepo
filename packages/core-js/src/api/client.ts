import { globalConfig } from '@/config/index.js';
import { convertKeysToCamelCase } from '@/utils/convertToCamelCase.js';
import axios from 'axios';
import axiosRetry from 'axios-retry';

const gatewayClient = axios.create({
  baseURL: globalConfig.env.gatewayBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

gatewayClient.interceptors.request.use(
  (config) => {
    if (config.headers['Skip-Authorization'] === true) {
      return config;
    }

    config.headers.setAuthorization(
      `Bearer ${globalConfig.authOptions?.userSessionKey}`,
    );

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

gatewayClient.interceptors.response.use(
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

const bffClient = axios.create({
  baseURL: globalConfig.env.bffBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

bffClient.interceptors.request.use(
  (config) => {
    config.headers.setAuthorization(
      `Bearer ${globalConfig.authOptions?.userSessionKey}`,
    );

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

bffClient.interceptors.response.use(
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

axiosRetry(bffClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

export { bffClient, gatewayClient };
