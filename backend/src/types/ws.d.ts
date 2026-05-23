/// <reference types="node" />

declare module 'ws' {
  import { EventEmitter } from 'events';
  import { IncomingMessage } from 'http';
  import { Duplex } from 'stream';
  import { Server as HttpServer } from 'http';

  class WebSocket extends EventEmitter {
    static readonly CONNECTING: 0;
    static readonly OPEN: 1;
    static readonly CLOSING: 2;
    static readonly CLOSED: 3;

    readonly readyState: 0 | 1 | 2 | 3;
    readonly url: string;

    constructor(address: string, options?: Record<string, unknown>);

    close(code?: number, reason?: string): void;
    ping(data?: unknown, mask?: boolean, cb?: (err: Error) => void): void;
    pong(data?: unknown, mask?: boolean, cb?: (err: Error) => void): void;
    send(data: unknown, cb?: (err?: Error) => void): void;
    terminate(): void;

    on(event: 'close', listener: (code: number, reason: Buffer) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'message', listener: (data: Buffer | string) => void): this;
    on(event: 'open', listener: () => void): this;
    on(event: 'ping', listener: (data: Buffer) => void): this;
    on(event: 'pong', listener: (data: Buffer) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  namespace WebSocket {
    interface ServerOptions {
      host?: string;
      port?: number;
      path?: string;
      noServer?: boolean;
      server?: HttpServer;
      maxPayload?: number;
    }
  }

  class WebSocketServer extends EventEmitter {
    constructor(options: WebSocket.ServerOptions, callback?: () => void);

    on(event: 'connection', listener: (ws: WebSocket, req: IncomingMessage) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'listening', listener: () => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;

    close(cb?: (err?: Error) => void): void;
    handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer, cb: (ws: WebSocket, req: IncomingMessage) => void): void;
  }

  export { WebSocket, WebSocketServer };
  export default WebSocket;
}
