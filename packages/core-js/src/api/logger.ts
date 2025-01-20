import { type AxiosResponse } from 'axios';

export function createLoggingInterceptor() {
  return [
    (response: AxiosResponse<any, any>) => {
      logReqRes({
        response: response,
      });
      return response;
    },

    (error: any) => {
      logReqRes({
        error: error,
      });
      return Promise.reject(error);
    },
  ];
}

function logReqRes({
  response,
  error,
}: {
  response?: AxiosResponse<any, any>;
  error?: any;
}): void {
  const reqConfig = response?.request || error?.config;
  const token =
    response?.headers['Authorization'] ||
    error.response?.headers['Authorization'];

  let reqData = JSON.stringify(reqConfig.data, null, 2);
  if (typeof reqConfig.data == 'string') {
    reqData = JSON.stringify(JSON.parse(reqConfig.data), null, 2);
  }

  let resData = JSON.stringify(response?.data, null, 2);
  if (typeof response?.data == 'string') {
    resData = JSON.stringify(JSON.parse(response?.data), null, 2);
  }

  let log = '';

  log += '-----------\n';
  log += 'Request\n';
  log += '-----------\n\n';
  log += 'Method: ' + reqConfig.method + '\n';
  log += 'URL: ' + reqConfig.url + '\n';
  log += 'Headers: ' + JSON.stringify(reqConfig.headers, null, 2) + '\n';
  log += 'Data: ' + reqData + '\n';
  log += '\n';

  log += '-----------\n';
  log += 'Response\n';
  log += '-----------\n\n';
  if (response != undefined) {
    log += 'Status: ' + response.data.status + '\n';
    log += 'Status Text: ' + response.data.statusText + '\n';
    log += 'Headers: ' + JSON.stringify(response.data.headers) + '\n';
    log += 'Data: ' + resData + '\n';
    log += '\n';
  } else {
    log += 'None\n\n';
  }

  if (error != undefined) {
    log += '-----------\n';
    log += 'Error\n';
    log += '-----------\n\n';
    log += 'Message: ' + error.message + '\n';
    log += 'Stack: ' + error.stack + '\n';
    log += 'Response Data: ' + resData + '\n';
    log += '\n';
  }

  log += '-----------\n';
  log += 'cURL\n';
  log += '-----------\n';

  log += generateCurl(reqConfig, token);

  console.log(log);
}

function generateCurl(config: any, token?: string): string {
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

  return curlCommand;
}
