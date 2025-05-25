import { WebView } from 'react-native-webview';
import type { MutableRefObject } from 'react';
import {
  type OnrampCallbacks,
} from './types.js';
import type { OnRampService } from './onRampService.js';

// Define the actual message structure based on your logs
interface WebViewMessage {
  type: string;
  params?: {
    control?: boolean;
    key?: string;
    source?: string;
    data?: any;
    [key: string]: any;
  };
  id?: string;
  response?: any;
}

// Response structure matching Flutter's ackJson()
interface WebViewResponse {
  type: string;
  response: any;
  source: string;
  id: string;
}

export class OnRampWebViewBridge {
  private webViewRef: MutableRefObject<WebView | null>;
  private callbacks: OnrampCallbacks;
  private onRampService: OnRampService;
  private tokenId: string;
  private readonly SOURCE_NAME = 'okto_web'; 

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

      console.log(
        `KARAN :: [WebView -> Native] Event: ${parsedMessage.type}`,
        parsedMessage,
      );

      // Handle the actual message types from your logs
      switch (parsedMessage.type) {
        case 'nativeBack':
          console.log('KARAN :: WebView native back event received');
          this.handleNativeBack(parsedMessage.params);
          break;

        case 'data': {
          console.log('KARAN :: DATA EVENT:', parsedMessage);
          const response = await this.handleDataRequest(parsedMessage);
          if (response) {
            this.sendAckResponse(response);
          }
          break;
        }

        case 'close':
          console.log('KARAN :: WebView close event received');
          // const forwardToRoute = parsedMessage.params?.forwardToRoute;
          this.callbacks.onClose?.();
          break;

        case 'url':
          console.log(
            'KARAN :: WebView URL event received:',
            parsedMessage.params,
          );
          this.handleUrl(parsedMessage.params);
          break;

        case 'requestPermission':
          console.log('REQUEST PERMISSION:', parsedMessage.params);
          console.log('KARAN :: Handling request permission:', parsedMessage);
          await this.handlePermission(parsedMessage);
          break;

        case 'requestPermissionAck':
          console.log('REQUEST PERMISSION ACK:', parsedMessage);
          this.handlePermissionAck(parsedMessage);
          break;

        case 'analytics':
          console.log('KARAN :: Analytics event received:', parsedMessage);
          // Handle analytics if needed
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

  private async handleDataRequest(
    message: WebViewMessage,
  ): Promise<WebViewResponse | null> {
    console.log('KARAN :: Fetching data for message:', message);

    const params = message.params;
    if (!params?.key) {
      console.warn('KARAN :: No key found in data request');
      return null;
    }

    const key = params.key;
    const source = params.source || '';
    const messageId = message.id || '';

    console.log(`KARAN :: Fetching data for key: ${key}, source: ${source}`);

    let result = '';

    try {
      if (source === 'remote-config') {
        result = await this.onRampService.getRemoteConfigValue(key);
        console.log('KARAN :: Remote config value fetched:', result);
      } else {
        switch (key) {
          case 'transactionId':
            result = await this.onRampService.getTransactionToken();
            console.log('KARAN :: Transaction token fetched:', result);
            break;

          case 'tokenData':
            if (source === this.tokenId) {
              const tokenData = await this.onRampService.getOnRampTokens();
              result = JSON.stringify(tokenData);
              console.log('KARAN :: Token data fetched:', result);
            }
            break;

          default:
            console.warn(`Unknown data key: ${key}`);
            return null;
        }
      }

      const response: WebViewResponse = {
        type: message.type,
        response: {
          [key]: result,
        },
        source: this.SOURCE_NAME,
        id: messageId,
      };

      console.log('KARAN :: Prepared data response:', response);
      return response;
    } catch (error) {
      console.error(`Failed to fetch data for key ${key}:`, error);

      // Create error response
      const errorResponse: WebViewResponse = {
        type: message.type,
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
          [key]: '',
        },
        source: this.SOURCE_NAME,
        id: messageId,
      };

      return errorResponse;
    }
  }

  private handleUrl(params: any): void {
    if (!params?.url) return;
    console.log('Handle URL:', params.url);
    // Add your URL handling logic here
    // this.callbacks.onUrlChange?.(params.url);
  }

  private async handlePermission(message: WebViewMessage): Promise<void> {
    const params = message.params;
    if (!params?.data) return;

    console.log('Handle permissions:', params.data);

    try {
      // Handle permission requests - integrate with react-native-permissions
      const permissionResult = await this.onRampService.requestPermissions(
        params.data,
      );

      // Create permission response
      const response: WebViewResponse = {
        type: 'requestPermission',
        response: permissionResult,
        source: this.SOURCE_NAME,
        id: message.id || '',
      };

      this.sendAckResponse(response);
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }

  private handlePermissionAck(message: WebViewMessage): void {
    console.log('REQUEST PERMISSION ACK:', message);

    const ackResponse: WebViewResponse = {
      type: 'requestPermission',
      response: message.response || {},
      source: this.SOURCE_NAME,
      id: message.id || '',
    };

    console.log('REQUEST PERMISSION SENT:', ackResponse);
    this.sendAckResponse(ackResponse);
    console.log('REQUEST PERMISSION SENT 2:', ackResponse);
  }

  private sendAckResponse(response: WebViewResponse): void {
    try {
      const messageString = JSON.stringify(response);
      console.log('KARAN :: Sending ACK response to WebView:', messageString);
      this.webViewRef.current?.postMessage(messageString);
    } catch (error) {
      console.error('Failed to send ACK response to WebView:', error);
    }
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
