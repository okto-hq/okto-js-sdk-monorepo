import React from 'react';
// import { Modal } from 'react-native';
import { type WebViewProps } from 'react-native-webview';
// import { OktoWebViewComponent } from './OktoWebView.js';
import type { HostReqIntf, HostResIntf } from '../types/webView.js';

// Singleton instance to manage the WebView state
export class OktoWebViewManager {
  private static instance: OktoWebViewManager;
  private isWebViewOpen: boolean = false;
  private webViewRef: any = null;
  private pendingRequests: Map<string, (response: HostResIntf) => void> = new Map();
  private onCloseCallback: (() => void) | null = null;
  
  // Configuration
  private webViewUrl: string = 'https://www.google.com/';
  private webViewProps: Partial<WebViewProps> = {};
  
  private constructor() {}
  
  public static getInstance(): OktoWebViewManager {
    if (!OktoWebViewManager.instance) {
      OktoWebViewManager.instance = new OktoWebViewManager();
    }
    return OktoWebViewManager.instance;
  }
  
  public setWebViewRef(ref: any): void {
    this.webViewRef = ref;
  }
  
  public isOpen(): boolean {
    return this.isWebViewOpen;
  }
  
  public open(options?: {
    url?: string;
    webViewProps?: Partial<WebViewProps>;
    onClose?: () => void;
  }): void {
    if (options?.url) {
      this.webViewUrl = options.url;
    }
    
    if (options?.webViewProps) {
      this.webViewProps = {
        ...this.webViewProps,
        ...options.webViewProps
      };
    }
    
    if (options?.onClose) {
      this.onCloseCallback = options.onClose;
    }
    
    this.isWebViewOpen = true;
    this.renderWebView();
  }
  
  public close(): void {
    this.isWebViewOpen = false;
    if (this.onCloseCallback) {
      this.onCloseCallback();
      this.onCloseCallback = null;
    }
    this.renderWebView();
  }
  
  // Send a request to the WebView and wait for a response
  public request(method: string, data: any): Promise<HostResIntf> {
    if (!this.isWebViewOpen || !this.webViewRef) {
      return Promise.reject('WebView is not open');
    }
    
    return this.webViewRef.sendRequest(method, data);
  }
  
  // Send information to the WebView without expecting a response
  public inform(method: string, data: any): void {
    if (!this.isWebViewOpen || !this.webViewRef) {
      console.warn('WebView is not open');
      return;
    }
    
    this.webViewRef.sendInfo(method, data);
  }
  
  // Handle incoming requests from the WebView
  public handleRequestFromWebView(request: HostReqIntf): void {
    if (!request || !request.method) {
      console.error('Invalid request from WebView');
      return;
    }
    
    const { id, method, data } = request;
    
    // Send loading status
    this.sendResponse(id, method, {
      status: 'loading',
      message: `Processing ${method}`
    });
    
    // Process the request based on the method
    this.processRequest(method, data)
      .then((result) => {
        this.sendResponse(id, method, {
          status: 'success',
          message: `${method} successful`,
          ...result
        });
      })
      .catch((error) => {
        this.sendResponse(id, method, {
          status: 'error',
          message: error.message || `${method} failed`
        });
      });
  }
  
  // Handle incoming info messages from the WebView
  public handleInfoFromWebView(info: HostReqIntf): void {
    // Handle info messages based on method
    const { method, data } = info;
    
    switch (method) {
      case 'okto_ui_state_update':
        // Handle UI state updates
        if (data.state === 'closed') {
          this.close();
        }
        break;
      
      // Handle other info methods as needed
      
      default:
        console.log(`Received info message: ${method}`, data);
    }
  }
  
  private sendResponse(requestId: string, method: string, responseData: any): void {
    if (!this.isWebViewOpen || !this.webViewRef) {
      console.error('WebView is not open');
      return;
    }
    
    this.webViewRef.sendResponse(requestId, method, responseData);
  }
  
  private processRequest(method: string, data: any): Promise<any> {
    // Process different request methods
    return new Promise((resolve, reject) => {
      switch (method) {
        case 'okto_sdk_login':
          // Call your SDK's login method
          // For example: this.oktoCoreSDK.login(data.provider, data)
          setTimeout(() => {
            resolve({ user: { id: '123', name: 'Test User' } });
          }, 1000);
          break;
          
        // Add other methods as needed
        
        default:
          reject(new Error(`Unknown method: ${method}`));
      }
    });
  }
  
  private renderWebView(): void {
    // This will be handled by React's state system in the actual implementation
    // Here we're just signaling that the state has changed
    console.log(`WebView is now ${this.isWebViewOpen ? 'open' : 'closed'}`);
  }
}

// The WebView component that will be rendered in the Modal
// const OktoWebViewComponent = React.forwardRef((props: any) => {
//   // Implementation of the WebView component
//   // Similar to the previous implementation but simplified
  
//   // ... WebView implementation code here
// });

// The single function that vendors will call
export function openOktoWebView(options?: {
  url?: string;
  webViewProps?: Partial<WebViewProps>;
  onClose?: () => void;
}): {
  close: () => void;
  request: (method: string, data: any) => Promise<HostResIntf>;
  inform: (method: string, data: any) => void;
} {
  const manager = OktoWebViewManager.getInstance();
  manager.open(options);
  
  return {
    close: () => manager.close(),
    request: (method, data) => manager.request(method, data),
    inform: (method, data) => manager.inform(method, data)
  };
}