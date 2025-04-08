import type {  InfoMessage } from '../types/channels.js';

export class InfoChannel {
  public receive(message: InfoMessage): void {
    // Handle info messages (analytics, logging, etc.)
    console.log('[InfoChannel] Received:', message);
    
    switch (message.method) {
      case 'okto_ui_state_update':
        this.handleUIStateUpdate(message.data);
        break;
      // Add other info handlers as needed
    }
  }

  private handleUIStateUpdate(data: any): void {
    // Handle UI state updates
    console.log('UI State Update:', data.state);
  }
}