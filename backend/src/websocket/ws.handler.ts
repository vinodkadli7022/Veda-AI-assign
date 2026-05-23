import { WebSocketServer, WebSocket } from 'ws';
type WebSocketType = InstanceType<typeof WebSocket>;
import { IncomingMessage } from 'http';
import { Server } from 'http';
import logger from '../utils/logger';
import { WebSocketMessage } from '../types/assessment.types';

interface ClientInfo {
  ws: WebSocketType;
  assessmentId: string;
  connectedAt: Date;
}

const clients = new Map<string, Set<ClientInfo>>();

export function initWebSocket(server: Server): InstanceType<typeof WebSocketServer> {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocketType, req: IncomingMessage) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const assessmentId = url.searchParams.get('assessmentId') || 'global';

    const clientInfo: ClientInfo = {
      ws,
      assessmentId,
      connectedAt: new Date(),
    };

    // Register client
    if (!clients.has(assessmentId)) {
      clients.set(assessmentId, new Set());
    }
    clients.get(assessmentId)!.add(clientInfo);

    logger.info('WebSocket client connected', {
      assessmentId,
      totalClients: clients.get(assessmentId)!.size,
    });

    // Send connected confirmation
    const connectMsg: WebSocketMessage = {
      type: 'connected',
      assessmentId,
      message: 'Connected to assessment updates',
    };
    ws.send(JSON.stringify(connectMsg));

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('pong', () => {
      // Client is alive
    });

    ws.on('message', (data: Buffer | string) => {
      try {
        const msg = JSON.parse(data.toString());
        logger.debug('WebSocket message received:', msg);
      } catch {
        // ignore invalid messages
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      clearInterval(heartbeat);
      const clientSet = clients.get(assessmentId);
      if (clientSet) {
        clientSet.delete(clientInfo);
        if (clientSet.size === 0) {
          clients.delete(assessmentId);
        }
      }
      logger.info('WebSocket client disconnected', { assessmentId, code });
    });

    ws.on('error', (err: Error) => {
      logger.error('WebSocket client error:', err.message);
      clearInterval(heartbeat);
    });
  });

  wss.on('error', (err: Error) => {
    logger.error('WebSocket server error:', err.message);
  });

  logger.info('WebSocket server initialized at /ws');
  return wss;
}

export function broadcastToAssessment(
  assessmentId: string,
  message: WebSocketMessage
): void {
  const clientSet = clients.get(assessmentId);
  if (!clientSet || clientSet.size === 0) {
    logger.debug('No WebSocket clients for assessment', { assessmentId });
    return;
  }

  const payload = JSON.stringify(message);
  let sent = 0;

  clientSet.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload, (err?: Error) => {
        if (err) logger.error('WebSocket send error:', err.message);
      });
      sent++;
    }
  });

  logger.debug('WebSocket broadcast', { assessmentId, clients: sent, type: message.type });
}

export function getConnectedClientsCount(): number {
  let total = 0;
  clients.forEach((set) => (total += set.size));
  return total;
}
