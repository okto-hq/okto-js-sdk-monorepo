// WebView Communication Types
export interface HostRequest {
    id: string;
    method: string;
    data: any;
  }
  
  export interface HostResponse {
    id: string;
    method: string;
    data: {
      status: 'loading' | 'success' | 'error';
      message?: string;
      [key: string]: any;
    };
  }
  
  export enum ChannelMethod {
    LOGIN = 'okto_sdk_login',
    UI_STATE_UPDATE = 'okto_ui_state_update',
    // Add other methods as needed
  }
  
  export interface WebViewChannelHandler {
    requestChannel: (request: HostRequest) => void;
    responseChannel: (response: HostResponse) => void;
    infoChannel: (info: HostRequest) => void;
  }
  
  export interface WebViewProps {
    initialUrl: string;
    onClose: () => void;
    onMessage?: (message: any) => void;
  }