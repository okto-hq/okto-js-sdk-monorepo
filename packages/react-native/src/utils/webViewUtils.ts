// src/utils/WebViewAuth.ts
import { Platform } from 'react-native';

export interface WebViewAuthOptions {
  authUrl: string;
  redirectUrl?: string;
  messageId?: string;
  onSuccess: (data: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

export interface WebViewParams {
  url: string;
  messageId: string;
  onMessage: (event: any) => void;
}

export class WebViewAuth {
  private static instance: WebViewAuth | null = null;
  private showWebViewCallback: ((params: WebViewParams) => void) | null = null;
  private hideWebViewCallback: (() => void) | null = null;

  // Singleton pattern
  static getInstance(): WebViewAuth {
    if (!WebViewAuth.instance) {
      WebViewAuth.instance = new WebViewAuth();
    }
    return WebViewAuth.instance;
  }

  // Register callbacks from your React component
  registerCallbacks(
    showWebView: (params: WebViewParams) => void,
    hideWebView: () => void
  ): void {
    this.showWebViewCallback = showWebView;
    this.hideWebViewCallback = hideWebView;
  }

  // Unregister callbacks when component unmounts
  unregisterCallbacks(): void {
    this.showWebViewCallback = null;
    this.hideWebViewCallback = null;
  }

  // Launch authentication WebView
  launchAuthFlow(options: WebViewAuthOptions): void {
    if (!this.showWebViewCallback) {
      throw new Error('WebView callbacks not registered. Call registerCallbacks first.');
    }

    const messageId = options.messageId || `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create message handler
    const onMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        
        // Verify this message is for our auth flow
        if (data.messageId !== messageId) return;
        
        if (data.type === 'AUTH_SUCCESS') {
          if (this.hideWebViewCallback) {
            this.hideWebViewCallback();
          }
          options.onSuccess(data.authData);
        } else if (data.type === 'AUTH_ERROR') {
          if (this.hideWebViewCallback) {
            this.hideWebViewCallback();
          }
          if (options.onError) {
            options.onError(new Error(data.message || 'Authentication failed'));
          }
        } else if (data.type === 'AUTH_CANCEL') {
          if (this.hideWebViewCallback) {
            this.hideWebViewCallback();
          }
          if (options.onCancel) {
            options.onCancel();
          }
        }
      } catch (err) {
        if (options.onError) {
          options.onError(new Error('Failed to parse WebView message'));
        }
      }
    };

    // Launch WebView
    this.showWebViewCallback({
      url: options.authUrl,
      messageId,
      onMessage
    });
  }

  // Close the WebView
  closeAuthFlow(): void {
    if (this.hideWebViewCallback) {
      this.hideWebViewCallback();
    }
  }

  // Build auth URL with parameters - Make this an instance method instead of static
  buildAuthUrl(params: {
    messageId: string;
    providerTypes: string[];
    apiKey: string;
    environment: string;
    callbackUrl?: string;
  }): string {
    const baseUrl = params.environment === 'sandbox' 
      ? 'https://auth.okto.io' 
      : 'https://auth.staging.okto.io';
    
    const queryParams = new URLSearchParams({
      messageId: params.messageId,
      providerTypes: params.providerTypes.join(','),
      apiKey: params.apiKey,
      platform: Platform.OS,
      ...(params.callbackUrl ? { callbackUrl: params.callbackUrl } : {})
    });
    
    return `${baseUrl}/auth?${queryParams.toString()}`;
  }
}

export default WebViewAuth.getInstance();