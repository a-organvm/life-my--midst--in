import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index';
import type { FastifyInstance } from 'fastify';
import WebSocket from 'ws';

describe('Websocket Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer({ disableAuth: true });
    await app.ready();
    await app.listen({ port: 0, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('connects to /v1/ws and broadcasts messages', async () => {
    const address = app.server.address() as any;
    const port = address.port;

    const client1 = new WebSocket(`ws://127.0.0.1:${port}/v1/ws`);
    const client2 = new WebSocket(`ws://127.0.0.1:${port}/v1/ws`);

    await new Promise<void>((resolve) => {
      let openCount = 0;
      const onOpen = () => {
        openCount++;
        if (openCount === 2) resolve();
      };
      client1.on('open', onOpen);
      client2.on('open', onOpen);
    });

    const messagesReceived: any[] = [];
    client2.on('message', (data) => {
      messagesReceived.push(JSON.parse(data.toString()));
    });

    client1.send(JSON.stringify({ type: 'user-typing', userId: 'user-123', payload: { thread: '1' } }));

    // Wait for message to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(messagesReceived).toHaveLength(1);
    expect(messagesReceived[0]).toEqual({
      type: 'user-typing',
      userId: 'user-123',
      payload: { thread: '1' },
    });

    client1.close();
    client2.close();
  });
});
