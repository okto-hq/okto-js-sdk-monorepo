import { WebView } from 'react-native-webview';
import type { ResponseMessage } from '../types/channels.js';
import React from 'react';

export class ResponseChannel {
  private webViewRef: React.RefObject<WebView>;

  constructor() {
    this.webViewRef = React.createRef<WebView>();
  }

  public sendResponse(message: ResponseMessage): void {
    if (this.webViewRef.current) {
      this.webViewRef.current.injectJavaScript(`
        (function() {
          try {
            window.responseChannel(${JSON.stringify(message)});
          } catch (error) {
            console.error('Error in responseChannel:', error);
          }
        })();
      `);
    }
  }

  public sendError(id: string, errorMessage: string, method?: string): void {
    this.sendResponse({
        id,
        method: method || 'unknown',
        data: {
            status: 'error',
            message: errorMessage
        },
        channel: 'responseChannel'
    });
  }
}