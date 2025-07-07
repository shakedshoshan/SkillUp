import { io, Socket } from 'socket.io-client';
import { StreamMessage } from './course-generation.service';

interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onUpdate?: (message: StreamMessage) => void;
  onComplete?: (result: any) => void;
  onStatusChange?: (status: any) => void;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private callbacks: WebSocketCallbacks = {};

  /**
   * Initialize WebSocket connection
   */
  connect(backendUrl: string, sessionId: string, callbacks: WebSocketCallbacks): void {
    if (this.socket) {
      this.disconnect();
    }

    this.callbacks = callbacks;
    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners(sessionId);
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(sessionId: string): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.socket?.emit('join_session', sessionId);
      this.callbacks.onConnect?.();
    });

    this.socket.on('course_generation_update', (message: StreamMessage) => {
      this.callbacks.onUpdate?.(message);
    });

    this.socket.on('course_generation_complete', (result: any) => {
      this.callbacks.onComplete?.(result);
    });

    this.socket.on('session_status', (status: any) => {
      console.log('Session status:', status);
      this.callbacks.onStatusChange?.(status);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      this.callbacks.onDisconnect?.();
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

export type { WebSocketCallbacks }; 