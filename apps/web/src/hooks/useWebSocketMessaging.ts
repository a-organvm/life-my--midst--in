'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketMessagingOptions {
  wsUrl?: string;
  userId?: string;
  reconnectInterval?: number;
}

const TYPING_TIMEOUT_MS = 3000;

export function useWebSocketMessaging(
  threadId: string | null,
  options: UseWebSocketMessagingOptions = {},
) {
  const {
    wsUrl = 'ws://localhost:3001/v1/ws',
    userId = 'anonymous',
    reconnectInterval = 3000,
  } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [presenceUserIds, setPresenceUserIds] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isUnmountedRef = useRef(false);
  const threadIdRef = useRef(threadId);

  const clearTypingTimer = useCallback((uid: string) => {
    const timer = typingTimersRef.current.get(uid);
    if (timer) {
      clearTimeout(timer);
      typingTimersRef.current.delete(uid);
    }
  }, []);

  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (!userId || userId === 'anonymous') return;
    if (isUnmountedRef.current) return;

    try {
      const url = userId ? `${wsUrl}?userId=${encodeURIComponent(userId)}` : wsUrl;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        setConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const message = JSON.parse(event.data as string) as {
            type: string;
            userId?: string;
            payload?: { thread?: string };
          };

          if (message.type === 'user-typing' && message.payload?.thread === threadIdRef.current) {
            const uid = message.userId;
            if (!uid) return;

            setTypingUserIds((prev) => {
              if (prev.includes(uid)) return prev;
              return [...prev, uid];
            });

            clearTypingTimer(uid);
            const timer = setTimeout(() => {
              setTypingUserIds((prev) => prev.filter((id) => id !== uid));
              typingTimersRef.current.delete(uid);
            }, TYPING_TIMEOUT_MS);
            typingTimersRef.current.set(uid, timer);
          }

          if (message.type === 'presence') {
            const uid = message.userId;
            if (!uid) return;
            const presenceMessage = message as { type: string; userId?: string; status?: string };
            const status = presenceMessage.status;
            if (status === 'online') {
              setPresenceUserIds((prev) => {
                if (prev.includes(uid)) return prev;
                return [...prev, uid];
              });
            } else if (status === 'offline') {
              setPresenceUserIds((prev) => prev.filter((id) => id !== uid));
            }
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        if (isUnmountedRef.current) return;
        setError('WebSocket connection failed');
        setConnected(false);
      };

      ws.onclose = () => {
        if (isUnmountedRef.current) return;
        setConnected(false);
        reconnectRef.current = setTimeout(() => {
          connectRef.current();
        }, reconnectInterval);
      };
    } catch {
      if (!isUnmountedRef.current) {
        setError('Failed to create WebSocket');
        reconnectRef.current = setTimeout(() => {
          connectRef.current();
        }, reconnectInterval);
      }
    }
  }, [userId, wsUrl, reconnectInterval, clearTypingTimer]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  const cleanup = useCallback(() => {
    isUnmountedRef.current = true;
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    typingTimersRef.current.forEach((timer) => clearTimeout(timer));
    typingTimersRef.current.clear();
    setConnected(false);
  }, []);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();
    return cleanup;
  }, [connect, cleanup]);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'user-typing',
          userId,
          payload: { thread: threadIdRef.current },
        }),
      );
      return true;
    }
    return false;
  }, [userId]);

  const isUserOnline = useCallback(
    (uid: string) => presenceUserIds.includes(uid),
    [presenceUserIds],
  );

  return {
    connected,
    error,
    typingUserIds,
    presenceUserIds,
    isUserOnline,
    sendTyping,
  };
}
