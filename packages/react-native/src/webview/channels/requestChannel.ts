import type { RequestMessage, RequestHandler } from '../types/channels.js';

export class RequestChannel {
  private handler: RequestHandler;

  constructor(handler: RequestHandler) {
    this.handler = handler;
  }

  public receive(message: RequestMessage): void {
    if (this.validateMessage(message)) {
      this.handler(message);
    }
  }

  private validateMessage(message: RequestMessage): boolean {
    return !!message.id && !!message.method;
  }
}