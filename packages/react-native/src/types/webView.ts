export interface HostReqIntf {
    id: string;
    method: string;
    data: any;
  }
  
  export interface HostResIntf {
    id: string;
    method: string;
    data: {
      status?: 'loading' | 'success' | 'error';
      message?: string;
      [key: string]: any;
    };
  }