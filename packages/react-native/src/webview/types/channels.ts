export interface ChannelMessage {
    channel: 'requestChannel' | 'responseChannel' | 'infoChannel';
    id: string;
    method: string;
    data?: any;
  }
  
  export interface RequestMessage extends ChannelMessage {
    channel: 'requestChannel';
    method: string;
    data: any;
  }
  
  export interface ResponseMessage extends ChannelMessage {
    channel: 'responseChannel';
    method: string;
    data: {
      status: 'loading' | 'success' | 'error';
      message: string;
      [key: string]: any;
    };
  }
  
  export interface InfoMessage extends ChannelMessage {
    channel: 'infoChannel';
    method: string;
    data: any;
  }
  
  export type RequestHandler = (message: RequestMessage) => void;