import { AxiosError, type AxiosResponse } from 'axios';

export function createLoggingInterceptor() {
  return [
    (response: AxiosResponse<any, any>) => {
      logResponse(response);
      return response;
    },

    (error: any) => {
      if (error instanceof AxiosError) {
        logError(error);
      }
      return Promise.reject(error);
    },
  ];
}

function logResponse(response: AxiosResponse<any, any>): void {
  let log = '';

  log += '-----------\n';
  log += 'Request\n';
  log += '-----------\n\n';
  log += 'Method: ' + response.config.method + '\n';
  log += 'URL: ' + response.config.baseURL + response.config.url + '\n';
  log += 'Headers: ' + JSON.stringify(response.config.headers, null, 2) + '\n';
  log +=
    'Data: ' +
    (response.config.data != undefined
      ? JSON.stringify(JSON.parse(response.config.data || ''), null, 2)
      : '') +
    '\n';
  log += '\n';

  log += '-----------\n';
  log += 'Response\n';
  log += '-----------\n\n';

  log += 'Status: ' + response.status + '\n';
  log += 'Status Text: ' + response.statusText + '\n';
  log += 'Headers: ' + JSON.stringify(response.headers, null, 2) + '\n';
  log += 'Data: ' + JSON.stringify(response.data, null, 2) + '\n';
  log += '\n';

  log += '-----------\n';
  log += 'cURL\n';
  log += '-----------\n';

  log += generateCurl(response.config, response.headers['Authorization'] || '');

  console.info(log);
}

function logError(error: AxiosError): void {
  let log = '';

  log += '-----------\n';
  log += 'Request\n';
  log += '-----------\n\n';
  log += 'Method: ' + error.request.method + '\n';
  log += 'URL: ' + error.config?.baseURL + error.config?.url + '\n';
  log += 'Headers: ' + JSON.stringify(error.config?.headers, null, 2) + '\n';
  log +=
    'Data: ' +
    (error.config?.data != undefined
      ? JSON.stringify(JSON.parse(error.config?.data), null, 2)
      : '') +
    '\n';
  log += '\n';

  log += '-----------\n';
  log += 'Response\n';
  log += '-----------\n\n';

  if (error.response != undefined) {
    log += 'Status: ' + error.response.status + '\n';
    log += 'Status Text: ' + error.response.statusText + '\n';
    log += 'Headers: ' + JSON.stringify(error.response.headers, null, 2) + '\n';
    log += 'Data: ' + JSON.stringify(error.response.data, null, 2) + '\n';
    log += '\n';
  } else {
    log += 'None\n\n';
  }

  log += '-----------\n';
  log += 'Error\n';
  log += '-----------\n\n';
  log += 'Message: ' + error.message + '\n';
  log += 'Stack: ' + error.stack + '\n';
  log +=
    'Response Data: ' + JSON.stringify(error.response?.data, null, 2) + '\n';
  log += '\n';

  log += '-----------\n';
  log += 'cURL\n';
  log += '-----------\n';

  log += generateCurl(
    error?.config,
    error?.response?.headers['Authorization'] || '',
  );

  console.error(log);
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
