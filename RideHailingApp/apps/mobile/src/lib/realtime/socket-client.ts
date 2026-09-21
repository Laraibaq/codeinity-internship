import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../api-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

type ConnectionListener = (connected: boolean) => void;

class RealtimeSocketClient {
  private socket: Socket | null = null;
  private connectionListeners: Set<ConnectionListener> = new Set();
  private isConnecting: boolean = false;

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    // Immediately call listener with current connection state
    listener(this.isConnected());
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (err) {
        console.error('Error in connection listener:', err);
      }
    });
  }

  public async connect(): Promise<Socket | null> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;
    try {
      const token = await getAccessToken();
      if (!token) {
        console.warn('[SocketClient] No auth token found; skipping connection');
        this.isConnecting = false;
        return null;
      }

      if (this.socket) {
        this.socket.disconnect();
        this.socket.removeAllListeners();
        this.socket = null;
      }

      this.socket = io(API_BASE_URL, {
        auth: { token },
        extraHeaders: {
          authorization: `Bearer ${token}`,
        },
        autoConnect: false,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('[SocketClient] Connected with id:', this.socket?.id);
        this.notifyConnectionChange(true);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketClient] Disconnected, reason:', reason);
        this.notifyConnectionChange(false);
      });

      this.socket.on('connect_error', (error) => {
        console.warn('[SocketClient] Connection error:', error.message);
        this.notifyConnectionChange(false);
      });

      this.socket.on('error', (err) => {
        console.warn('[SocketClient] Server error:', err);
      });

      this.socket.connect();
      return this.socket;
    } catch (err) {
      console.error('[SocketClient] Error during connection setup:', err);
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
      this.notifyConnectionChange(false);
    }
  }

  public joinRoom(room: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit('room:join', { room }, (response: any) => {
        resolve(response || { success: true });
      });
    });
  }

  public leaveRoom(room: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('room:leave', { room });
    }
  }

  public on<T = any>(event: string, callback: (data: T) => void): () => void {
    if (!this.socket) {
      this.connect();
    }

    const handler = (data: T) => {
      callback(data);
    };

    this.socket?.on(event, handler);

    return () => {
      this.socket?.off(event, handler);
    };
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

export const socketClient = new RealtimeSocketClient();
