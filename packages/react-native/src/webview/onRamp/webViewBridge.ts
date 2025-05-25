import { WebView } from 'react-native-webview';
import type { MutableRefObject } from 'react';
import {
  WebEvent,
  WebKeys,
  type OnrampCallbacks,
  type WebEventModel,
} from './types.js';
import type { OnRampService } from './onRampService.js';

// Define the actual message structure based on your logs
interface WebViewMessage {
  type: string;
  params?: {
    control?: boolean;
    key?: string;
    source?: string;
    [key: string]: any;
  };
  id?: string;
}

export class OnRampWebViewBridge {
  private webViewRef: MutableRefObject<WebView | null>;
  private callbacks: OnrampCallbacks;
  private onRampService: OnRampService;
  private tokenId: string;

  constructor(
    webViewRef: MutableRefObject<WebView | null>,
    callbacks: OnrampCallbacks,
    onRampService: OnRampService,
    tokenId: string,
  ) {
    this.webViewRef = webViewRef;
    this.callbacks = callbacks;
    this.onRampService = onRampService;
    this.tokenId = tokenId;
  }

  async handleMessage(event: any): Promise<void> {
    try {
      const data = event.nativeEvent.data;
      console.log('KARAN :: handleWebViewMessage ', data);
      console.log('KARAN :: Received message from WebView:', data);
      
      let parsedMessage: WebViewMessage;

      if (typeof data === 'string') {
        console.log('KARAN :: Received string data from WebView:', data);
        parsedMessage = JSON.parse(data);
      } else {
        console.log('KARAN :: Received non-string data from WebView:', data);
        parsedMessage = data;
      }

      // Log the actual structure we're working with
      console.log('KARAN :: Parsed model:', parsedMessage.id);
      console.log('KARAN :: Parsed model:', parsedMessage.type);
      console.log('KARAN :: Parsed model:', parsedMessage.params);

      console.log(`KARAN :: [WebView -> Native] Event: ${parsedMessage.type}`, parsedMessage);

      // Handle the actual message types from your logs
      switch (parsedMessage.type) {
        case 'nativeBack':
          console.log('KARAN :: WebView native back event received');
          this.handleNativeBack(parsedMessage.params);
          break;

        case 'data':
          console.log('KARAN :: DATA EVENT:', parsedMessage);
          await this.handleDataRequest(parsedMessage);
          break;

        case 'close':
          console.log('KARAN :: WebView close event received');
          this.callbacks.onClose?.();
          break;

        case 'url':
          console.log('KARAN :: WebView URL event received:', parsedMessage.params);
          this.handleUrl(parsedMessage.params);
          break;

        case 'requestPermission':
          console.log('REQUEST PERMISSION:', parsedMessage.params);
          console.log('KARAN :: Handling request permission:', parsedMessage);
          this.handlePermission(parsedMessage.params);
          break;

        default:
          console.warn(`Unhandled event: ${parsedMessage.type}`);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  }

  private handleNativeBack(params?: { control?: boolean }): void {
    console.log('KARAN :: Handling native back with params:', params);
    
    if (params?.control) {
      // Handle controlled back navigation
      this.callbacks.onClose?.();
    } else {
      // Handle regular back navigation
      // You might want to add specific logic here
    }
  }

  private async handleDataRequest(message: WebViewMessage): Promise<void> {
    console.log('KARAN :: Fetching data for message:', message);
    
    const params = message.params;
    if (!params?.key) {
      console.warn('KARAN :: No key found in data request');
      return;
    }

    const key = params.key;
    const source = params.source || '';
    const messageId = message.id;

    console.log(`KARAN :: Fetching data for key: ${key}, source: ${source}`);

    let result = '';

    try {
      if (source === 'remote-config') {
        result = await this.onRampService.getRemoteConfigValue(key);
      } else {
        switch (key) {
          case 'transactionId':
            result = await this.onRampService.getTransactionToken();
            break;

          case 'tokenData':
            if (source === this.tokenId) {
              const tokenData = await this.onRampService.getTokenData();
              result = JSON.stringify(tokenData);
            }
            break;

          default:
            console.warn(`Unknown data key: ${key}`);
            return;
        }
      }

      // Send response back to WebView
      const response = {
        type: 'dataResponse',
        id: messageId,
        params: {
          key: key,
          value: result,
          source: source
        }
      };

      console.log('KARAN :: Sending data response:', response);
      this.sendMessage(response);

    } catch (error) {
      console.error(`Failed to fetch data for key ${key}:`, error);
      
      // Send error response
      const errorResponse = {
        type: 'dataError',
        id: messageId,
        params: {
          key: key,
          error: error instanceof Error ? error.message : 'Unknown error',
          source: source
        }
      };
      
      this.sendMessage(errorResponse);
    }
  }

  private handleUrl(params: any): void {
    if (!params?.url) return;
    console.log('Handle URL:', params.url);
    // Add your URL handling logic here
  }

  private handlePermission(params: any): void {
    if (!params?.requestPermissions) return;
    console.log('Handle permissions:', params.requestPermissions);
    // Handle permission requests - could integrate with react-native-permissions
  }

  sendMessage(message: any): void {
    try {
      const messageString = JSON.stringify(message);
      console.log('KARAN :: Sending message to WebView:', messageString);
      this.webViewRef.current?.postMessage(messageString);
    } catch (error) {
      console.error('Failed to send message to WebView:', error);
    }
  }

  cleanup(): void {
    // Clean up any resources if needed
    console.log('KARAN :: Cleaning up WebView bridge');
  }
}