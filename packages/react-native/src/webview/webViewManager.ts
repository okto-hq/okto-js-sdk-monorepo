import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { RequestChannel } from './channels/requestChannel.js';
import { ResponseChannel } from './channels/responseChannel.js';
import { InfoChannel } from './channels/infoChannel.js';
import type { ChannelMessage, RequestMessage, ResponseMessage, InfoMessage } from './types/channels.js';
import React from 'react';
import {useNavigation} from '@react-navigation/native';

export class WebViewManager {
  private webViewRef: React.RefObject<WebView>;
  private requestChannel: RequestChannel;
  private responseChannel: ResponseChannel;
  private infoChannel: InfoChannel;

  constructor() {
    this.webViewRef = React.createRef<WebView>();
    this.requestChannel = new RequestChannel(this.handleRequest);
    this.responseChannel = new ResponseChannel();
    this.infoChannel = new InfoChannel();
  }

  public openWebViewScreen(url: string, initialData?: any): void {
    console.log("karan is here in openWebViewScreen");
    useNavigation.push('OktoWebView', {
      screen: 'OktoWebView',
      params: { url, initialData },
    });
  }

  private handleRequest = (message: RequestMessage): void => {
    // Process request from WebView and send response
    try {
      switch (message.method) {
        case 'okto_sdk_login':
          this.handleLoginRequest(message);
          break;
        // Add other method handlers as needed
        default:
          this.responseChannel.sendError(
            message.id,
            'Unsupported method',
            message.method
          );
      }
    } catch (error) {
      this.responseChannel.sendError(
        message.id,
        error instanceof Error ? error.message : 'Unknown error',
        message.method
      );
    }
  };

  private handleLoginRequest(message: RequestMessage): void {
    // Example login handler
    const { provider, ...additionalData } = message.data;
    
    // Send loading state
    this.responseChannel.sendResponse({
      id: message.id,
      method: message.method,
      data: {
        status: 'loading',
        message: 'Processing login request'
      },
      channel: 'responseChannel'
    });

    // Process login (simplified example)
    setTimeout(() => {
      this.responseChannel.sendResponse({
        id: message.id,
        method: message.method,
        data: {
          status: 'success',
          message: 'Login successful',
          token: 'sample-auth-token',
          user: { id: '123', name: 'Test User' }
        },
        channel: 'responseChannel'
      });
    }, 2000);
  }

  public handleWebViewMessage(event: WebViewMessageEvent): void {
    try {
      const message: ChannelMessage = JSON.parse(event.nativeEvent.data);

      switch (message.channel) {
        case 'requestChannel':
          this.requestChannel.receive(message as RequestMessage);
          break;
        case 'infoChannel':
          this.infoChannel.receive(message as InfoMessage);
          break;
        case 'responseChannel':
          console.warn('Unexpected message on responseChannel');
          break;
        default:
          console.warn('Unknown channel type', message.channel);
      }
    } catch (error) {
      console.error('Error processing WebView message:', error);
    }
  }

  public injectWebViewScripts(): string {
    return `
      (function() {
        // Setup communication channels in WebView
        window.requestChannel = {
          postMessage: function(data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              channel: 'requestChannel',
              ...JSON.parse(data)
            }));
          }
        };

        window.responseChannel = function(data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            channel: 'responseChannel',
            ...data
          }));
        };

        window.infoChannel = {
          postMessage: function(data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              channel: 'infoChannel',
              ...JSON.parse(data)
            }));
          }
        };

        // Notify WebView that channels are ready
        document.dispatchEvent(new Event('oktoChannelsReady'));
      })();
    `;
  }
}