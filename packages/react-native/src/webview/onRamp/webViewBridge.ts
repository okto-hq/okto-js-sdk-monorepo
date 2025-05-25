import { WebView } from 'react-native-webview';
import type { MutableRefObject } from 'react';
import { WebEvent, WebKeys, type OnrampCallbacks, type WebEventModel } from './types.js';
import type { OnRampService } from './onRampService.js';

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
      console.log('KARAN :: Received message from WebView:', data);
      let model: WebEventModel;

      if (typeof data === 'string') {
        console.log('KARAN :: Received string data from WebView:', data);
        model = JSON.parse(data);
        console.log('KARAN :: Parsed model:', model.id);
        console.log('KARAN :: Parsed model:', model.event);
        console.log('KARAN :: Parsed model:', model.request);
        console.log('KARAN :: Parsed model:', model.response);
      } else {
        console.log('KARAN :: Received non-string data from WebView:', data);
        model = data;
      }

      console.log(`KARAN :: [WebView -> Native] Event: ${model.event}`, model);

      switch (model.event) {

        case WebEvent.CLOSE:
          console.log('KARAN :: WebView close event received');
          this.callbacks.onClose?.();
          break;

        case WebEvent.URL:
          console.log('KARAN :: WebView URL event received:', model.request);
          this.handleUrl(model.request);
          break;

        case WebEvent.REQUEST_PERMISSION:
          console.log('REQUEST PERMISSION:', model.request?.data);
          console.log('KARAN :: Handling request permission:', model);
          this.handlePermission({ requestPermissions: model.request?.data });
          break;

        case WebEvent.REQUEST_PERMISSION_ACK:
          { console.log('REQUEST PERMISSION ACK:', model);
            console.log('KARAN :: Acknowledging permission request:', model);
          const ackResponse = {
            ...model,
            event: WebEvent.REQUEST_PERMISSION,
          };
          this.sendMessage(ackResponse);
          break; }

        case WebEvent.DATA:
          console.log('KARAN :: DATA EVENT:', model);
          { const response = await this.fetchAndAckData(model);
          if (response) {
            this.sendAckMessage(response);
          }
          break; }

        default:
          console.warn(`Unhandled event: ${model.event}`);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  }

  private async fetchAndAckData(model: WebEventModel): Promise<WebEventModel | null> {
    console.log('KARAN :: Fetching data for model:', model);
    const request = model.request;
    if (!request) return null;

    const key = request[WebKeys.KEY] as string || '';
    const source = request[WebKeys.SOURCE] as string || '';
    console.log(`KARAN :: Fetching data for key: ${key}, source: ${source}`);

    let result = '';

    if (source === WebKeys.REMOTE_CONFIG) {
      result = await this.onRampService.getRemoteConfigValue(key);
    } else {
      switch (key) {
        case WebKeys.TRANSACTION_ID:
          try {
            result = await this.onRampService.getTransactionToken();
          } catch (error) {
            console.error('Failed to get transaction token:', error);
            result = '';
          }
          break;

        case WebKeys.TOKEN_DATA:
          if (source === this.tokenId) {
            try {
              const tokenData = await this.onRampService.getTokenData();
              result = JSON.stringify(tokenData);
            } catch (error) {
              console.error('Failed to get token data:', error);
              result = '';
            }
          }
          break;

        default:
          console.warn(`Unknown data key: ${key}`);
      }
    }

    return {
      ...model,
      response: {
        [key]: result,
      },
    };
  }

  private handleUrl(data: Record<string, any> | undefined): void {
    if (!data?.url) return;
    
    console.log('Handle URL:', data.url);
  }

  private handlePermission(data: Record<string, any> | undefined): void {
    if (!data?.requestPermissions) return;
    
    console.log('Handle permissions:', data.requestPermissions);
    // Handle permission requests - could integrate with react-native-permissions
  }

  sendMessage(message: any): void {
    try {
      this.webViewRef.current?.postMessage(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message to WebView:', error);
    }
  }

  private sendAckMessage(model: WebEventModel): void {
    this.sendMessage(model);
  }

  cleanup(): void {
    // Clean up any resources if needed
  }
}