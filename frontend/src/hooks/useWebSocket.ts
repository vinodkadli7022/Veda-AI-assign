'use client';

import { useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage } from '@/types';

const WS_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:5000`
    : 'ws://localhost:5000';

interface UseWebSocketOptions {
  assessmentId: string | null;
  onMessage: (msg: WebSocketMessage) => void;
  enabled?: boolean;
}

export function useWebSocket({ assessmentId, onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnects = 5;

  const connect = useCallback(() => {
    if (!assessmentId || !enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = `${WS_URL}/ws?assessmentId=${assessmentId}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        console.log('[WS] Connected for assessment:', assessmentId);
      };

      ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data);
          onMessage(msg);
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] Error:', err);
      };

      ws.onclose = (event) => {
        console.log('[WS] Closed:', event.code, event.reason);
        wsRef.current = null;

        // Auto-reconnect with exponential backoff
        if (
          enabled &&
          reconnectAttemptsRef.current < maxReconnects &&
          event.code !== 1000
        ) {
          const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
    }
  }, [assessmentId, enabled, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounted');
      wsRef.current = null;
    }
    reconnectAttemptsRef.current = maxReconnects; // prevent reconnect
  }, []);

  useEffect(() => {
    if (enabled && assessmentId) {
      reconnectAttemptsRef.current = 0;
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [assessmentId, enabled, connect, disconnect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, disconnect };
}
