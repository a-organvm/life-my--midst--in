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

  function getPort(): number {
    return (app.server.address() as any).port;
  }

  async function connectWithCollect(
    port: number,
    userId: string,
  ): Promise<{ ws: WebSocket.WebSocket; messages: any[] }> {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/v1/ws?userId=${encodeURIComponent(userId)}`);
    const messages: any[] = [];
    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        ws.on('message', (data) => {
          const str =
            typeof data === 'string'
              ? data
              : Buffer.from(data as ArrayBuffer | Buffer[]).toString();
          messages.push(JSON.parse(str));
        });
        resolve();
      });
    });
    return { ws, messages };
  }

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  it('connects to /v1/ws and broadcasts user-typing messages', async () => {
    const port = getPort();

    const { ws: c1, messages: m1 } = await connectWithCollect(port, 'typing-test-a');
    const { ws: c2, messages: m2 } = await connectWithCollect(port, 'typing-test-b');

    // Clear initial presence messages
    await delay(50);
    m1.length = 0;
    m2.length = 0;

    // Send typing from c2; c1 should receive it
    c2.send(
      JSON.stringify({ type: 'user-typing', userId: 'typing-test-b', payload: { thread: '1' } }),
    );

    await delay(100);

    expect(m1.filter((m) => m.type === 'user-typing')).toEqual([
      { type: 'user-typing', userId: 'typing-test-b', payload: { thread: '1' } },
    ]);
    // c2 should not receive its own message
    expect(m2.filter((m) => m.type === 'user-typing')).toEqual([]);

    c1.close();
    c2.close();
    await delay(50);
  });

  it('broadcasts presence online when user connects', async () => {
    const port = getPort();

    const { ws: c1, messages: m1 } = await connectWithCollect(port, 'presence-online-a');
    const { ws: c2, messages: m2 } = await connectWithCollect(port, 'presence-online-b');

    // Flush initial connect messages
    await delay(50);
    m1.length = 0;
    m2.length = 0;

    // Connect a third user
    const { ws: c3 } = await connectWithCollect(port, 'presence-online-c');
    await delay(100);

    // c1 and c2 should see the online event for c3
    const c1Presence = m1.filter((m) => m.type === 'presence');
    const c2Presence = m2.filter((m) => m.type === 'presence');
    expect(c1Presence.length).toBeGreaterThanOrEqual(1);
    expect(c2Presence.length).toBeGreaterThanOrEqual(1);
    expect(c1Presence[0]).toMatchObject({
      type: 'presence',
      userId: 'presence-online-c',
      status: 'online',
    });
    expect(c2Presence[0]).toMatchObject({
      type: 'presence',
      userId: 'presence-online-c',
      status: 'online',
    });

    c1.close();
    c2.close();
    c3.close();
    await delay(50);
  });

  it('broadcasts presence offline when user disconnects', async () => {
    const port = getPort();

    const { ws: c1, messages: m1 } = await connectWithCollect(port, 'presence-offline-a');
    const { ws: c2, messages: m2 } = await connectWithCollect(port, 'presence-offline-b');

    // Flush initial messages
    await delay(50);
    m1.length = 0;
    m2.length = 0;

    c1.close();
    await delay(100);

    // c2 should see offline event for c1
    const offlineMessages = m2.filter((m) => m.type === 'presence' && m.status === 'offline');
    expect(offlineMessages.length).toBeGreaterThanOrEqual(1);
    expect(offlineMessages[0]).toMatchObject({
      type: 'presence',
      userId: 'presence-offline-a',
      status: 'offline',
    });
    // c1 should not receive its own offline
    expect(m1.filter((m) => m.type === 'presence')).toEqual([]);

    c2.close();
    await delay(50);
  });
});
