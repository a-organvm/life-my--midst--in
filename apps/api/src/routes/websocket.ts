import type { FastifyPluginAsync } from 'fastify';
import type { WebSocket } from 'ws';

interface WSMessage {
  type: string;
  payload?: unknown;
  userId?: string;
}

const connectedUsers = new Map<string, Set<WebSocket>>();

function broadcastExcept(
  fastify: Parameters<FastifyPluginAsync>[0],
  message: string,
  sender: WebSocket,
) {
  for (const client of fastify.websocketServer.clients) {
    if (client !== sender && client.readyState === 1) {
      client.send(message);
    }
  }
}

function broadcastToAll(fastify: Parameters<FastifyPluginAsync>[0], message: string) {
  for (const client of fastify.websocketServer.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

export const registerWebsocketRoutes: FastifyPluginAsync = (fastify) => {
  fastify.get('/ws', { websocket: true }, (connection, request) => {
    const userId =
      ((request.query as Record<string, string | undefined>).userId as string) || 'anonymous';

    // Register user connection
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(connection);

    broadcastExcept(
      fastify,
      JSON.stringify({ type: 'presence', userId, status: 'online' }),
      connection,
    );

    connection.on('message', (message: Buffer | string) => {
      try {
        const parsed = JSON.parse(message.toString()) as unknown as WSMessage;

        if (parsed.type === 'user-typing') {
          broadcastExcept(
            fastify,
            JSON.stringify({
              type: 'user-typing',
              userId: parsed.userId,
              payload: parsed.payload,
            }),
            connection,
          );
        }
      } catch (error) {
        fastify.log.error({ err: error }, 'Failed to parse websocket message');
      }
    });

    connection.on('close', () => {
      const userConnections = connectedUsers.get(userId);
      if (userConnections) {
        userConnections.delete(connection);
        if (userConnections.size === 0) {
          connectedUsers.delete(userId);
        }
      }

      broadcastToAll(fastify, JSON.stringify({ type: 'presence', userId, status: 'offline' }));
    });
  });

  return Promise.resolve();
};
