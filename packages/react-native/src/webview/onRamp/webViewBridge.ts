// OnRampWebViewBridge.ts
import { WebView } from 'react-native-webview';
import type { MutableRefObject } from 'react';
import type { WebViewEventType } from '../authentication/types.js';
import type { OnrampCallbacks } from './types.js';

export interface OnRampBridgeMessage {
  type: WebViewEventType;
  id: string;
  event: string;
  params?: Record<string, any>;
  source?: string;
  timestamp?: number;
}

export interface OnRampWebViewRequest {
  id: string;
  type: string;
  params?: Record<string, any>;
  source?: string;
}

export interface OnRampWebViewResponse {
  id: string;
  type: string;
  response: Record<string, any>;
  source: string;
  error?: string;
}

/**
 * OnRampWebViewBridge - Dedicated bridge for OnRamp WebView communication
 * Handles bidirectional communication between React Native and OnRamp WebView
 */
export class OnRampWebViewBridge {
  private webViewRef: MutableRefObject<WebView | null>;
  private callbacks: OnrampCallbacks;
  private requestHandlers: Map<
    string,
    (request: OnRampWebViewRequest) => Promise<any>
  > = new Map();
  private responseHandlers: Map<
    string,
    (response: OnRampWebViewResponse) => void
  > = new Map();
  private pendingRequests: Map<
    string,
    { resolve: (value: any) => void; reject: (error: any) => void }
  > = new Map();
  private messageQueue: OnRampBridgeMessage[] = [];
  private isWebViewReady = false;
  private requestIdCounter = 0;

  constructor(
    webViewRef: MutableRefObject<WebView | null>,
    callbacks: OnrampCallbacks = {},
  ) {
    this.webViewRef = webViewRef;
    this.callbacks = callbacks;
    this.setupDefaultHandlers();
  }

  /**
   * Set up default message handlers for common OnRamp events
   */
  private setupDefaultHandlers(): void {
    // Handle close events
    this.registerRequestHandler('close', async () => {
      this.callbacks.onClose?.();
      return { status: 'acknowledged' };
    });

    // Handle success events
    this.registerRequestHandler('orderSuccess', async (request) => {
      const data = request.params?.data;
      this.callbacks.onSuccess?.(data);
      return { status: 'success', data };
    });

    // Handle error events
    this.registerRequestHandler('orderFailure', async (request) => {
      const error = request.params?.error || 'Transaction failed';
      this.callbacks.onError?.(error);
      return { status: 'error', error };
    });

    // Handle progress updates
    this.registerRequestHandler('progress', async (request) => {
      const progress = request.params?.progress || 0;
      this.callbacks.onProgress?.(progress);
      return { status: 'acknowledged', progress };
    });
  }

  /**
   * Register a handler for specific request types
   */
  public registerRequestHandler(
    type: string,
    handler: (request: OnRampWebViewRequest) => Promise<any>,
  ): void {
    this.requestHandlers.set(type, handler);
  }

  /**
   * Register a handler for specific response types
   */
  public registerResponseHandler(
    type: string,
    handler: (response: OnRampWebViewResponse) => void,
  ): void {
    this.responseHandlers.set(type, handler);
  }

  /**
   * Handle incoming messages from WebView
   */
  public handleMessage(event: any): void {
    try {
      const message: OnRampBridgeMessage = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'request':
          console.log(`[WebView -> Native] REQUEST: ${message.event}`, message.params);
          this.handleIncomingRequest(message);
          break;
        case 'response':
          console.log(`[WebView -> Native] RESPONSE: ${message.event}`, message.params);
          this.handleIncomingResponse(message);
          break;
        case 'info':
          console.log(`[WebView -> Native] INFO: ${message.event}`, message.params);
          this.handleInfoMessage(message);
          break;
        case 'error':
          console.error(`[WebView -> Native] ERROR: ${message.event}`, message.params);
          this.handleErrorMessage(message);
          break;
        default:
          console.warn(`[WebView -> Native] UNKNOWN TYPE: ${message.type}`, message);
      }
    } catch (error) {
      console.error('[WebView -> Native] Failed to parse message:', event.nativeEvent.data);
    }
  }
  

  /**
   * Handle incoming requests from WebView
   */
  private async handleIncomingRequest(
    message: OnRampBridgeMessage,
  ): Promise<void> {
    const request: OnRampWebViewRequest = {
      id: message.id,
      type: message.event,
      params: message.params,
      source: message.source,
    };
    console.log('[OnRampWebViewBridge] Incoming request:', request.type, request.params);

    const handler = this.requestHandlers.get(request.type);
    if (handler) {
      try {
        const result = await handler(request);
        this.sendResponse({
          id: request.id,
          type: request.type,
          response: result,
          source: 'okto_native',
        });
      } catch (error) {
        console.error(`Error handling request ${request.type}:`, error);
        this.sendResponse({
          id: request.id,
          type: request.type,
          response: {},
          source: 'okto_native',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      console.warn(`No handler registered for request type: ${request.type}`);
      this.sendResponse({
        id: request.id,
        type: request.type,
        response: { status: 'unhandled' },
        source: 'okto_native',
      });
    }
  }

  /**
   * Handle incoming responses from WebView
   */
  private handleIncomingResponse(message: OnRampBridgeMessage): void {
    const response: OnRampWebViewResponse = {
      id: message.id,
      type: message.event,
      response: message.params || {},
      source: message.source || 'onramp_web',
    };

    // Check if this is a response to a pending request
    const pendingRequest = this.pendingRequests.get(response.id);
    if (pendingRequest) {
      this.pendingRequests.delete(response.id);
      if (response.error) {
        pendingRequest.reject(new Error(response.error));
      } else {
        pendingRequest.resolve(response.response);
      }
      return;
    }

    // Check if there's a registered response handler
    const handler = this.responseHandlers.get(response.type);
    if (handler) {
      handler(response);
    } else {
      console.log('Unhandled response:', response);
    }
  }

  /**
   * Handle info messages from WebView
   */
  private handleInfoMessage(message: OnRampBridgeMessage): void {
    console.log('OnRamp WebView Info:', message);
    // Can be extended to handle specific info messages
  }

  /**
   * Handle error messages from WebView
   */
  private handleErrorMessage(message: OnRampBridgeMessage): void {
    console.error('OnRamp WebView Error:', message);
    const error = message.params?.error || 'Unknown WebView error';
    this.callbacks.onError?.(error);
  }

  /**
   * Send a request to the WebView
   */
  public async sendRequest(
    type: string,
    params: Record<string, any> = {},
    timeout: number = 10000,
  ): Promise<any> {
    const id = this.generateRequestId();
    const message: OnRampBridgeMessage = {
      type: 'request',
      id,
      event: type,
      params,
      source: 'okto_native',
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${type}`));
      }, timeout);

      // Store the pending request
      this.pendingRequests.set(id, {
        resolve: (value) => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });

      // Send the message
      this.postMessage(message);
    });
  }

  /**
   * Send a response to the WebView
   */
  public sendResponse(response: OnRampWebViewResponse): void {
    const message: OnRampBridgeMessage = {
      type: 'response',
      id: response.id,
      event: response.type,
      params: response.response,
      source: response.source,
      timestamp: Date.now(),
    };

    this.postMessage(message);
  }

  /**
   * Send an info message to the WebView
   */
  public sendInfo(type: string, params: Record<string, any> = {}): void {
    const message: OnRampBridgeMessage = {
      type: 'info',
      id: this.generateRequestId(),
      event: type,
      params,
      source: 'okto_native',
      timestamp: Date.now(),
    };

    this.postMessage(message);
  }

  /**
   * Post message to WebView
   */
  private postMessage(message: OnRampBridgeMessage): void {
    if (!this.isWebViewReady) {
      this.messageQueue.push(message);
      return;
    }

    const messageString = JSON.stringify(message);
    console.log('Sending to OnRamp WebView:', messageString);

    this.webViewRef.current?.postMessage(messageString);
  }

  /**
   * Mark WebView as ready and flush queued messages
   */
  public setWebViewReady(): void {
    this.isWebViewReady = true;

    // Flush queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.postMessage(message);
      }
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `onramp_${++this.requestIdCounter}_${Date.now()}`;
  }

  /**
   * Get data from WebView
   */
  public async getData(key: string, source?: string): Promise<any> {
    return this.sendRequest('data', { key, source });
  }

  /**
   * Request permissions from native
   */
  public async requestPermissions(
    permissions: string[],
  ): Promise<Record<string, string>> {
    return this.sendRequest('requestPermissions', { permissions });
  }

  /**
   * Open external URL
   */
  public async openUrl(url: string): Promise<void> {
    return this.sendRequest('openUrl', { url });
  }

  /**
   * Update callbacks
   */
  public updateCallbacks(callbacks: Partial<OnrampCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Reject all pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Bridge cleanup'));
    });
    this.pendingRequests.clear();

    // Clear handlers
    this.requestHandlers.clear();
    this.responseHandlers.clear();

    // Clear message queue
    this.messageQueue.length = 0;

    // Reset state
    this.isWebViewReady = false;
    this.requestIdCounter = 0;
  }

  /**
   * Get bridge statistics for debugging
   */
  public getStats(): {
    pendingRequests: number;
    queuedMessages: number;
    isReady: boolean;
    requestHandlers: string[];
    responseHandlers: string[];
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      queuedMessages: this.messageQueue.length,
      isReady: this.isWebViewReady,
      requestHandlers: Array.from(this.requestHandlers.keys()),
      responseHandlers: Array.from(this.responseHandlers.keys()),
    };
  }
}
