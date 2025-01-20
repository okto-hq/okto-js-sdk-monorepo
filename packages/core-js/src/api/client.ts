import { globalConfig } from '@/config/index.js';
import { getAuthorizationToken } from '@/utils/auth.js';
import { convertKeysToCamelCase } from '@/utils/convertToCamelCase.js';
import axios from 'axios';
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
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response) => {
      logCurlCommand(response.config);
      console.log('Request Data:', JSON.stringify(response.config.data));
      console.log('\nResponse Data:', JSON.stringify(response.data), '\n');
      return response;
    },
    (error) => {
      if (error.response) {
        logCurlCommand(error.response.config);
        console.log('Request Data:', JSON.stringify(error.response.config.data));
        console.log('\nResponse Data:', JSON.stringify(error.response.data), '\n');
      }
      return Promise.reject(error);
    },
  );

  return client;
}

function logCurlCommand(config: any) {
  const method = config.method.toUpperCase();
  const url = new URL(config.url, config.baseURL).href;
  const headers = config.headers;
  const data = config.data ? `-d '${JSON.stringify(config.data)}'` : '';

  let curl = `curl -X ${method} '${url}'`;
  for (const [key, value] of Object.entries(headers)) {
    curl += ` -H '${key}: ${value}'`;
  }
  curl += ` ${data}`;
  console.log('\n----- cURL Command Start -----\n');
  console.log(curl);
  console.log('\n----- cURL Command End -----\n');
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
