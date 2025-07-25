// DEFAULT_ALLOWED_ORIGINS is an array of allowed origins for the webview.
// It is used to validate the origin of the request and ensure that only trusted origins can access the webview.
export const DEFAULT_ALLOWED_ORIGINS = [
  'https://onboarding.oktostage.com',
  'https://sandbox-onboarding.okto.tech',
  'https://onboarding.okto.tech',
  'https://sandbox-pay.okto.tech',
  'https://pay.oktostage.com',
  'https://pay.okto.tech',
];

export const DEFAULT_WEBVIEW_URL = DEFAULT_ALLOWED_ORIGINS[0]; // THIS IS THE DEFAULT URL FOR THE WEBVIEW
export const TARGET_ORIGIN_RESPONSE = DEFAULT_ALLOWED_ORIGINS[0]; // THIS IS THE TARGET ORIGIN FOR THE RESPONSE TO THE REQUEST IN THE WEBVIEW

export const DEFAULT_REQUEST_TIMEOUT = 30000;

export const CHANNELS = {
  REQUEST: 'requestChannel',
  RESPONSE: 'responseChannel',
  INFO: 'infoChannel',
};

export const MESSAGE_TYPES = {
  SDK_READY: 'sdk_ready',
  WEBVIEW_READY: 'webview_ready',
  ACKNOWLEDGE: 'acknowledge',
};

export const DEFAULT_MODAL_STYLE = {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: '2147483647',
};

export const DEFAULT_IFRAME_STYLE = {
  width: '100%',
  height: '100%',
  border: 'none',
  borderRadius: '8px',
};
