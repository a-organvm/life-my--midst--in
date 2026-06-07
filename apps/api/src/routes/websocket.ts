import type { FastifyPluginAsync } from 'fastify';

interface WSMessage {
  type: string;
  payload?: any;
  userId?: string;
}

export const registerWebsocketRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/ws', { websocket: true }, (connection, _request) => {
    // We can extract user ID from JWT if needed (request.user), 
    // but for now let's just do a basic broadcast for typing indicators.
    
    connection.on('message', (message: Buffer | string) => {
      try {
        const parsed = JSON.parse(message.toString()) as WSMessage;
        
        if (parsed.type === 'user-typing') {
          // Broadcast to all other connected clients
          for (const client of fastify.websocketServer.clients) {
            if (client !== connection && client.readyState === 1) { // OPEN
              client.send(JSON.stringify({
                type: 'user-typing',
                userId: parsed.userId,
                payload: parsed.payload,
              }));
            }
          }
        }
      } catch (error) {
        fastify.log.error({ err: error }, 'Failed to parse websocket message');
      }
    });

    connection.on('close', () => {
      // Clean up connection state if needed
    });
  });
};
