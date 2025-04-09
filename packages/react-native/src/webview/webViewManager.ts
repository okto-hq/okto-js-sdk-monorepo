// src/webview/WebViewManager.ts

import { NativeModules, Platform } from 'react-native';
import type { WebViewConfig, HostRequest, HostResponse, WebViewResponseCallback } from '../types/webview.js';

export interface OktoWebViewModuleInterface {
  openWebView(
    url: string,
    headers: Record<string, string>,
    successCallback: (success: boolean) => void,
    errorCallback?: (error: string) => void
  ): void;
  
  closeWebView(
    successCallback: () => void,
    errorCallback?: (error: string) => void
  ): void;
}

const OktoWebViewModule = NativeModules.OktoWebViewModule as OktoWebViewModuleInterface;


class WebViewManager {
  private static instance: WebViewManager;
  private webViewRef: any = null;
  private activeListeners: Set<string> = new Set();

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): WebViewManager {
    if (!WebViewManager.instance) {
      WebViewManager.instance = new WebViewManager();
    }
    return WebViewManager.instance;
  }

  /**
   * Launches the WebView with the provided configuration
   * @param config Configuration for the WebView
   * @returns Promise that resolves when the WebView is launched
   */
  public launchWebView(config: WebViewConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (Platform.OS === 'android') {
          OktoWebViewModule.openWebView(
            config.url,
            config.headers || {},
            () => {
              resolve();
            },
            (error: string) => {
              reject(new Error(error));
            }
          );
        } else if (Platform.OS === 'ios') {
          OktoWebViewModule.openWebView(
            config.url,
            config.headers || {},
            (success: boolean) => {
              if (success) {
                resolve();
              } else {
                reject(new Error('Failed to open WebView'));
              }
            }
          );
        } else {
          reject(new Error('Platform not supported'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Closes the active WebView
   */
  public closeWebView(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        OktoWebViewModule.closeWebView(
          () => {
            resolve();
          },
          (error: string) => {
            reject(new Error(error));
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sets the reference to the WebView component
   * @param ref Reference to the WebView component
   */
  public setWebViewRef(ref: any): void {
    this.webViewRef = ref;
  }

  /**
   * Sends a request to the WebView
   * @param request Request to send
   * @param callback Callback for the response
   * @returns Promise that resolves with the response
   */
  public sendRequest(
    request: Omit<HostRequest, 'id'>,
    callback?: WebViewResponseCallback
  ): Promise<HostResponse> {
    return new Promise((resolve, reject) => {
      if (!this.webViewRef) {
        reject(new Error('WebView reference not set'));
        return;
      }

      const finalCallback = (response: HostResponse) => {
        if (callback) {
          callback(response);
        }

        if (response.data.status === 'success') {
          resolve(response);
        } else if (response.data.status === 'error') {
          reject(new Error(response.data.message || 'Unknown error'));
        }
        // If status is 'loading', we continue waiting for the final response
      };

      // Use the channels module to send the request
      const { sendRequest } = require('./channels');
      sendRequest(this.webViewRef, request, finalCallback);
    });
  }

  /**
   * Sends an inform message to the WebView
   * @param request Information to send
   */
  public sendInform(request: Omit<HostRequest, 'id'>): void {
    if (!this.webViewRef) {
      console.warn('WebView reference not set');
      return;
    }

    const { sendInform } = require('./channels');
    sendInform(this.webViewRef, request);
  }
}

export default WebViewManager.getInstance();