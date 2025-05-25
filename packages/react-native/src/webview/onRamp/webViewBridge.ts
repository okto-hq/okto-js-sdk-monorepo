// webViewBridge.js
import { WebView } from 'react-native-webview';
import type { MutableRefObject } from 'react';
import {
  WebEvent,
  WebKeys,
  type OnrampCallbacks,
  type WebEventModel,
} from './types.js';
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
      console.log("ACK :: 1 :: Received data type:", typeof data, "Data:", data);
      
      // Parse the message similar to Flutter implementation
      const model = this.parseWebEventModel(data);
      console.log("ACK :: 2 :: Parsed model:", model);
      
      if (!model) {
        console.warn("Failed to parse WebEventModel");
        return;
      }

      // Handle events matching Flutter switch statement
      switch (model.event) {
        case WebEvent.ANALYTICS:
          console.log("Analytics event received");
          break;

        case WebEvent.CLOSE:
          console.log("Close event received");
          // const forwardToRoute = model.request?.[WebKeys.FORWARD_TO_ROUTE];
          this.callbacks.onClose?.();
          break;

        case WebEvent.URL:
          console.log("URL event received");
          this.handleUrl(model.request);
          break;

        case WebEvent.REQUEST_PERMISSION:
          console.log("REQUEST PERMISSION ::", model.request?.data);
          this.handlePermission({ requestPermissions: model.request?.data });
          break;

        case WebEvent.REQUEST_PERMISSION_ACK:
          { console.log("REQUEST PERMISSION ACK ::", model);
          const ack = this.createAckResponse(model, WebEvent.REQUEST_PERMISSION);
          console.log("REQUEST PERMISSION SENT ::", ack);
          this.send(ack);
          break; }

        case WebEvent.DATA:
          console.log("Data request received:", model);
          const response = await this.fetchAndAckData(model);
          if (response) {
            console.log("Sending data response:", response);
            this.send(response);
          }
          break;

        default:
          console.warn("Unhandled event type:", model.event);
      }
    } catch (error) {
      console.error("WEB :: Error ->", error);
    }
  }

  private parseWebEventModel(data: any): WebEventModel | null {
    try {
      let jsonData;
      
      if (typeof data === 'string') {
        jsonData = JSON.parse(data);
      } else if (typeof data === 'object') {
        jsonData = data;
      } else {
        return null;
      }

      // Parse similar to Flutter WebEventModel.fromJson
      return {
        event: this.getWebEventFromType(jsonData.type),
        request: jsonData.params,
        id: jsonData.id,
        response: jsonData.response,
        source: "okto_web"
      };
    } catch (error) {
      console.error("Error parsing WebEventModel:", error);
      return null;
    }
  }

  private getWebEventFromType(type: string): WebEvent {
    switch (type) {
      case 'analytics':
        return WebEvent.ANALYTICS;
      case 'close':
        return WebEvent.CLOSE;
      case 'url':
        return WebEvent.URL;
      case 'requestPermission':
        return WebEvent.REQUEST_PERMISSION;
      case 'requestPermission_ack':
        return WebEvent.REQUEST_PERMISSION_ACK;
      case 'data':
        return WebEvent.DATA;
      default:
        return WebEvent.DATA; // Default fallback
    }
  }

  private async fetchAndAckData(model: WebEventModel): Promise<any | null> {
    const request = model.request;
    if (!request || Object.keys(request).length === 0) {
      return null;
    }

    const key = request[WebKeys.KEY] || "";
    const source = request[WebKeys.SOURCE] || "";

    console.log(`Fetching data for key: ${key}, source: ${source}`);

    let res = '';

    try {
      if (source === WebKeys.REMOTE_CONFIG) {
        res = await this.onRampService.getRemoteConfigValue(key);
      } else {
        switch (key) {
          case WebKeys.TRANSACTION_ID:
            res = await this.onRampService.getTransactionToken() || "";
            break;
          case WebKeys.TOKEN_DATA:
            if (source === this.tokenId) {
              const tokenData = await this.onRampService.getTokenData();
              // Create the response similar to Flutter's OnRampToken.ackJson()
              const tokenJson = this.createTokenResponse(tokenData);
              res = JSON.stringify(tokenJson);
            }
            break;
          default:
            console.warn(`Unknown data key: ${key}`);
            return null;
        }
      }

      // Return the response in Flutter-compatible format
      return this.createDataAckResponse(model, key, res);
    } catch (error) {
      console.error(`Error fetching data for key ${key}:`, error);
      return null;
    }
  }

  private createTokenResponse(tokenData: any): any {
    // This should match Flutter's OnRampToken.ackJson() format
    if (!tokenData) return {};
    
    return {
      id: tokenData.id,
      name: tokenData.name,
      symbol: tokenData.shortName,
      iconUrl: tokenData.image || tokenData.logo,
      networkId: tokenData.networkId,
      networkName: tokenData.networkName,
      address: tokenData.address,
      balance: tokenData.balance,
      precision: tokenData.precision,
      chainId: tokenData.chainId
    };
  }

  private createDataAckResponse(model: WebEventModel, key: string, response: string): any {
    // Match Flutter's ackJson() format
    return {
      type: model.event,
      response: {
        [key]: response
      },
      source: "okto_web",
      id: model.id
    };
  }

  private createAckResponse(model: WebEventModel, eventType: WebEvent): any {
    // Match Flutter's copyWith().ackJson() format
    return {
      type: eventType,
      response: model.response,
      source: "okto_web",
      id: model.id
    };
  }

  private handleUrl(params: any): void {
    if (!params?.url) return;
    console.log('Handle URL:', params.url);
    // Add your URL handling logic here
  }

  private handlePermission(params: any): void {
    if (!params?.requestPermissions) return;
    console.log('Handle permissions:', params.requestPermissions);
    // Handle permission requests
  }

  private send(message: any): void {
    try {
      const messageString = JSON.stringify(message);
      console.log('Sending message to WebView:', messageString);
      this.webViewRef.current?.postMessage(messageString);
    } catch (error) {
      console.error('Failed to send message to WebView:', error);
    }
  }

  cleanup(): void {
    console.log('Cleaning up WebView bridge');
  }
}