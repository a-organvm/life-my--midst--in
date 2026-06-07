import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocketMessaging } from '../useWebSocketMessaging';

type MessageHandler = (event: { data: string }) => void;
type VoidHandler = () => void;

interface MockWebSocketInstance {
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  readyState: number;
  onopen: VoidHandler | null;
  onmessage: MessageHandler | null;
  onerror: VoidHandler | null;
  onclose: VoidHandler | null;
  url: string;
}

const mockInstances: MockWebSocketInstance[] = [];
let constructorCalls: string[] = [];

class MockWebSocket {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;
  onopen: VoidHandler | null = null;
  onmessage: MessageHandler | null = null;
  onerror: VoidHandler | null = null;
  onclose: VoidHandler | null = null;
  send = vi.fn();
  close = vi.fn();
  url: string;

  constructor(url: string) {
    this.url = url;
    constructorCalls.push(url);
    mockInstances.push(this);
    setTimeout(() => this.onopen?.(), 0);
  }
}

beforeEach(() => {
  mockInstances.length = 0;
  constructorCalls = [];
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.stubGlobal('WebSocket', MockWebSocket);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useWebSocketMessaging', () => {
  it('connects to websocket when userId is provided', async () => {
    renderHook(() => useWebSocketMessaging(null, { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(constructorCalls).toEqual(['ws://localhost:3001/v1/ws?userId=test-user']);
  });

  it('does not connect when userId is null or anonymous', () => {
    renderHook(() => useWebSocketMessaging('thread-1'));

    expect(mockInstances).toHaveLength(0);
  });

  it('returns connected=true after onopen', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.connected).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('sends user-typing message via sendTyping', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'user-123' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      result.current.sendTyping();
    });

    expect(mockInstances[0]!.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'user-typing',
        userId: 'user-123',
        payload: { thread: 'thread-1' },
      }),
    );
  });

  it('adds typing user from incoming message', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({
          type: 'user-typing',
          userId: 'other-user',
          payload: { thread: 'thread-1' },
        }),
      });
    });

    expect(result.current.typingUserIds).toEqual(['other-user']);
  });

  it('ignores typing messages for other threads', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({
          type: 'user-typing',
          userId: 'other-user',
          payload: { thread: 'thread-2' },
        }),
      });
    });

    expect(result.current.typingUserIds).toEqual([]);
  });

  it('removes typing user after timeout', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({
          type: 'user-typing',
          userId: 'other-user',
          payload: { thread: 'thread-1' },
        }),
      });
    });

    expect(result.current.typingUserIds).toEqual(['other-user']);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.typingUserIds).toEqual([]);
  });

  it('resets typing timer on repeated typing events', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({
          type: 'user-typing',
          userId: 'other-user',
          payload: { thread: 'thread-1' },
        }),
      });
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.typingUserIds).toEqual(['other-user']);

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({
          type: 'user-typing',
          userId: 'other-user',
          payload: { thread: 'thread-1' },
        }),
      });
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.typingUserIds).toEqual(['other-user']);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.typingUserIds).toEqual([]);
  });

  it('handles duplicate typing users without duplicates in array', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({
          type: 'user-typing',
          userId: 'other-user',
          payload: { thread: 'thread-1' },
        }),
      });
    });

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({
          type: 'user-typing',
          userId: 'other-user',
          payload: { thread: 'thread-1' },
        }),
      });
    });

    expect(result.current.typingUserIds).toEqual(['other-user']);
  });

  it('reconnects on close', async () => {
    renderHook(() =>
      useWebSocketMessaging('thread-1', { userId: 'test-user', reconnectInterval: 100 }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockInstances).toHaveLength(1);

    const firstInstance = mockInstances[0]!;
    act(() => {
      firstInstance.onclose?.();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(mockInstances).toHaveLength(2);
  });

  it('sets error state on websocket error', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      mockInstances[0]!.onerror?.();
    });

    expect(result.current.error).toBe('WebSocket connection failed');
    expect(result.current.connected).toBe(false);
  });

  it('includes userId as query param in WS URL', async () => {
    renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(constructorCalls[0]).toBe('ws://localhost:3001/v1/ws?userId=test-user');
  });

  it('tracks presence online from incoming message', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({ type: 'presence', userId: 'user-a', status: 'online' }),
      });
    });

    expect(result.current.presenceUserIds).toEqual(['user-a']);
  });

  it('tracks presence offline from incoming message', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({ type: 'presence', userId: 'user-a', status: 'online' }),
      });
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({ type: 'presence', userId: 'user-b', status: 'online' }),
      });
    });

    expect(result.current.presenceUserIds).toEqual(['user-a', 'user-b']);

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({ type: 'presence', userId: 'user-a', status: 'offline' }),
      });
    });

    expect(result.current.presenceUserIds).toEqual(['user-b']);
  });

  it('isUserOnline returns true for online users, false for offline', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({ type: 'presence', userId: 'user-a', status: 'online' }),
      });
    });

    expect(result.current.isUserOnline('user-a')).toBe(true);
    expect(result.current.isUserOnline('user-b')).toBe(false);
  });

  it('deduplicates presence online events', async () => {
    const { result } = renderHook(() => useWebSocketMessaging('thread-1', { userId: 'test-user' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({ type: 'presence', userId: 'user-a', status: 'online' }),
      });
      mockInstances[0]!.onmessage?.({
        data: JSON.stringify({ type: 'presence', userId: 'user-a', status: 'online' }),
      });
    });

    expect(result.current.presenceUserIds).toEqual(['user-a']);
  });

  it('cleans up on unmount', async () => {
    const { unmount } = renderHook(() =>
      useWebSocketMessaging('thread-1', { userId: 'test-user' }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const instance = mockInstances[0]!;
    unmount();

    expect(instance.close).toHaveBeenCalled();
  });
});
