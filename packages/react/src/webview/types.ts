/**
 * @WebViewOptions
 * @description Interface for configuring the webview.
 * @property {string} [url] - URL to load in the webview.
 * @property {number} [width] - Width of the webview.
 * @property {number} [height] - Height of the webview.
 * @property {function} [onSuccess] - Callback function for successful login.
 * @property {function} [onError] - Callback function for login error.
 * @property {function} [onClose] - Callback function for closing the webview.
 * @property {Partial<CSSStyleDeclaration>} [modalStyle] - CSS styles for the modal.
 * @property {Partial<CSSStyleDeclaration>} [iframeStyle] - CSS styles for the iframe.
 */
export interface WebViewOptions {
  url?: string;
  width?: number;
  height?: number;
  onSuccess?: (user: any) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  modalStyle?: Partial<CSSStyleDeclaration>;
  iframeStyle?: Partial<CSSStyleDeclaration>;
}

/**
 * @WebViewMessage
 * @description Interface for messages sent between the webview and the main application.
 * @property {string} id - Unique identifier for the message.
 * @property {string} method - Method name for the message.
 * @property {'requestChannel' | 'responseChannel' | 'infoChannel'} channel - Channel type for the message.
 */
export interface WebViewMessage {
  id: string;
  method: string;
  channel: 'requestChannel' | 'responseChannel' | 'infoChannel';
  data?: any;
  status?: 'success' | 'error';
  message?: string;
}

/**
 * @WebViewRequest
 * @description Interface for requests sent from the webview to the main application.
 * @property {string} eventName - Name of the event.
 * @property {string} eventData - Data associated with the event.
 * @property {any} [key: string] - Additional properties.
 * @property {string} [key: string] - Additional properties.
 */
export interface WebViewRequest {
  eventName?: string;
  eventData?: string;
  [key: string]: any;
}
/**
 * @WebViewRequestHandler
 * @description Type definition for a function that handles requests from the webview.
 * @param {any} data - The data received from the webview.
 * @returns {void} - No return value.
 * @example
 * const myRequestHandler: WebViewRequestHandler = async (data) => {
 *  return { success: true, message: 'Request handled successfully' };
 * };
 */
export type WebViewRequestHandler = (data: any) => Promise<any> | void;


/**
 * @WhatsAppOtpResponse
 * @description Interface for the WhatsApp OTP response data.
 * @property {string} provider - The provider of the OTP service.
 * @property {string} whatsapp_number - The WhatsApp number to which the OTP was sent.
 * @property {string} otp - The OTP sent to the user.
 * @property {string} token - A token associated with the OTP process.
 * @property {string} message - A detailed status message.
 * @property {string | null} error - An error message if the process fails, or null if successful.
 */
export interface WhatsAppOtpResponse {
  provider: string;
  whatsapp_number: string;
  otp?: string;
  token?: string;
  message?: string;
  error?: string | null;
}