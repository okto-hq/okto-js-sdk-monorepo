import type { Address } from '@okto_web3/core-js-sdk/types';

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
  onSuccess?: (user: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  modalStyle?: Partial<CSSStyleDeclaration>;
  iframeStyle?: Partial<CSSStyleDeclaration>;
}

/**
 * @WebViewResponseOptions
 * @description Interface for responses sent from the webview to the main application.
 * @property {function} onSuccess - Callback function for successful response.
 * @property {function} onError - Callback function for error response.
 * @property {function} onClose - Callback function for closing the response.
 */
export interface WebViewResponseOptions {
  onSuccess?: (data: string) => Address | void;
  onError?: (error: Error) => void;
  onClose?: () => void;
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
  data?: unknown;
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
  [key: string]: unknown;
}
/**
 * @WebViewRequestHandler
 * @description Type definition for a function that handles requests from the webview.
 * @param {object} data - The structured data received from the webview.
 * @returns {Promise<unknown> | void} - A promise or nothing.
 */
export type WebViewRequestHandler = (
  data: {
    id?: string;
    method?: string;
    data?: { [key: string]: unknown };
  },
  style?: AppearanceOptions,
) => Promise<unknown> | void;

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

/****************************** ONBOARDING CUSTOMISATION OPTIONS ***********************************/

/**
 * @AppearanceOptions
 * @description Interface for configuring the appearance of the application.
 * @property {string} version - Version of the appearance configuration.
 * @property {AppearanceTheme} appearance - Theme configuration.
 * @property {VendorInfo} vendor - Vendor information.
 * @property {LoginOptions} loginOptions - Login options configuration.
 */
export interface AppearanceOptions {
  version?: string;
  appearance?: AppearanceTheme;
  vendor?: VendorInfo;
  loginOptions?: LoginOptions;
}

/**
 * @AppearanceTheme
 * @description Interface for theme configuration.
 * @property {"dark" | "light"} themeName - Pre-defined theme names.
 * @property {Record<string, string>} theme - Custom theme variables.
 */
export interface AppearanceTheme {
  themeName?: 'dark' | 'light';
  theme?: ThemeVariables;
}

/**
 * @VendorInfo
 * @description Interface for vendor information.
 * @property {string} name - Name of the vendor.
 * @property {string} logo - URL of the vendor logo.
 */
export interface VendorInfo {
  name?: string;
  logo?: string;
}

/**
 * @LoginOptions
 * @description Interface for login options configuration.
 * @property {SocialLogin[]} socialLogins - List of social login options.
 * @property {OtpLoginOption[]} otpLoginOptions - List of OTP login options.
 * @property {ExternalWallet[]} externalWallets - List of external wallet options.
 */
export interface LoginOptions {
  socialLogins?: SocialLogin[];
  otpLoginOptions?: OtpLoginOption[];
  externalWallets?: ExternalWallet[];
}

/**
 * @SocialLogin
 * @description Interface for social login options.
 * @property {string} type - Type of social login (e.g., "google", "steam", "twitter").
 * @property {number} position - Position of the social login in the list.
 */
export interface SocialLogin {
  type?: 'google' | 'steam' | 'twitter' | 'apple';
  position?: number;
}

/**
 * @OtpLoginOption
 * @description Interface for OTP login options.
 * @property {string} type - Type of OTP login (e.g., "email", "whatsapp").
 * @property {number} position - Position of the OTP login in the list.
 */
export interface OtpLoginOption {
  type?: 'email' | 'whatsapp';
  position?: number;
}

/**
 * @ExternalWallet
 * @description Interface for external wallet options.
 * @property {string} type - Type of external wallet (e.g., "metamask", "walletconnect").
 * @property {number} position - Position of the external wallet in the list.
 * @property {Record<string, unknown>} metadata - Additional metadata for the wallet.
 */
export interface ExternalWallet {
  type?: string;
  position?: number;
  metadata?: Record<string, unknown>;
}

/**
 * @ThemeVariables
 * @description Interface for theme variables.
 * @property {string} [key: string] - Key-value pairs for theme variables.
 */
export interface ThemeVariables {
  '--okto-body-background'?: string; // background for whole page
  '--okto-body-color-tertiary'?: string; // placeholder text color
  '--okto-accent-color'?: string; // accent color for buttons etc.
  '--okto-button-font-weight'?: string | number;
  '--okto-border-color'?: string; // border color for inputs
  '--okto-stroke-divider'?: string; // divider color
  '--okto-font-family'?: string;
  '--okto-rounded-sm'?: string; // small border radius
  '--okto-rounded-md'?: string; // medium border radius
  '--okto-rounded-lg'?: string; // large border radius
  '--okto-rounded-xl'?: string; // extra large border radius
  '--okto-rounded-full'?: string; // full border radius
  '--okto-success-color'?: string; // success color for alerts
  '--okto-warning-color'?: string; // warning color for alerts
  '--okto-error-color'?: string; // error color for alerts
  '--okto-text-primary'?: string; // primary color for texts
  '--okto-text-secondary'?: string; // secondary colors for texts (ex. subtitles)
  '--okto-background-surface'?: string; // background color for card header in desktop view
  [key: string]: string | number | undefined; // additional custom theme variables
}
