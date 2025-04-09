// src/webview/WebViewManager.ts

import type { WebViewConfig, HostRequest, HostResponse, WebViewResponseCallback } from '../types/webview.js';
import { sendRequest, sendInform } from './channels.js';
import { v4 as uuid } from 'uuid';

// Event emitter to handle navigation events
import { EventEmitter } from 'events';

class WebViewManager {
  private static instance: WebViewManager;
  private webViewRef: any = null;
  private isWebViewOpen: boolean = false;
  private eventEmitter: EventEmitter;
  private navigationListeners: Map<string, ((...args: any[]) => void)> = new Map();

  private constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public static getInstance(): WebViewManager {
    if (!WebViewManager.instance) {
      WebViewManager.instance = new WebViewManager();
    }
    return WebViewManager.instance;
  }

  /**
   * Opens WebView through React Navigation or similar
   * @param config Configuration for the WebView
   * @returns Promise that resolves when navigation is triggered
   */
  public launchWebView(config: WebViewConfig): Promise<void> {
    return new Promise((resolve) => {
      // Set flag that WebView is open
      this.isWebViewOpen = true;
      
      // Emit navigation event for the wrapper component to handle
      this.eventEmitter.emit('navigateToWebView', config);
      
      // Resolve immediately as the actual navigation will be handled by the React component
      resolve();
    });
  }

  /**
   * Closes the WebView by triggering navigation
   */
  public closeWebView(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isWebViewOpen) {
        this.isWebViewOpen = false;
        this.eventEmitter.emit('closeWebView');
      }
      resolve();
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
   * Register a navigation listener
   * @param event Event name
   * @param callback Function to call when event occurs
   * @returns Listener ID for removal
   */
  public addNavigationListener(event: string, callback: (...args: any[]) => void): string {
    const listenerId = uuid();
    this.eventEmitter.on(event, callback);
    this.navigationListeners.set(listenerId, callback);
    return listenerId;
  }

  /**
   * Remove a navigation listener
   * @param listenerId ID returned from addNavigationListener
   * @param event Event name
   */
  public removeNavigationListener(listenerId: string, event: string): void {
    const listener = this.navigationListeners.get(listenerId);
    if (listener) {
      this.eventEmitter.off(event, listener);
      this.navigationListeners.delete(listenerId);
    }
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

    sendInform(this.webViewRef, request);
  }

  /**
   * Check if WebView is currently open
   */
  public isOpen(): boolean {
    return this.isWebViewOpen;
  }
}

export default WebViewManager.getInstance();