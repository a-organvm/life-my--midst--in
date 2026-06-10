'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Search, Archive, Plus, Check } from 'lucide-react';
import Link from 'next/link';
import { useWebSocketMessaging } from '../hooks/useWebSocketMessaging';

interface Thread {
  id: string;
  participantIds: string[];
  participantName: string;
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageTime: string;
  unreadCount: number;
  isArchived: boolean;
}

interface Notification {
  id: string;
  type: string;
  actor: { id: string; name: string; avatar?: string };
  content: string;
  read: boolean;
  createdAt: string;
}

export default function MessageInbox({ userId }: { userId: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedThreadId] = useState<string | null>(null);

  const { isUserOnline } = useWebSocketMessaging(null, { userId });

  const isThreadParticipantOnline = useCallback(
    (thread: Thread) => {
      const partnerId = thread.participantIds.find((pid) => pid !== userId);
      return partnerId ? isUserOnline(partnerId) : false;
    },
    [userId, isUserOnline],
  );

  const loadThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/messages/threads');
      if (response.ok) {
        const data = (await response.json()) as { threads: Thread[] };
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = (await response.json()) as {
          notifications: Notification[];
          unreadCount: number;
        };
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
    void loadNotifications();
  }, [userId, loadThreads, loadNotifications]);

  const filterThreads = useCallback(() => {
    let filtered = threads;

    // Filter by archive status
    if (!showArchived) {
      filtered = filtered.filter((t) => !t.isArchived);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredThreads(filtered);
  }, [threads, searchQuery, showArchived]);

  useEffect(() => {
    filterThreads();
  }, [filterThreads]);

  const handleArchiveThread = async (threadId: string) => {
    // Update UI optimistically
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, isArchived: true } : t)));

    // API call
    try {
      await fetch(`/api/messages/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      });
    } catch (error) {
      console.error('Failed to archive thread:', error);
      // Revert on error
      void loadThreads();
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      void loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Messages</h1>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                showArchived
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showArchived ? 'Showing Archived' : 'Active'}
            </button>
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Notifications Banner */}
      {unreadCount > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <strong>{unreadCount}</strong> unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              {notifications.slice(0, 3).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="flex items-center gap-2 px-2 py-1 bg-white rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span>{notif.actor.name}</span>
                  {!notif.read && <Check className="w-3 h-3 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-6 text-center text-gray-600">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-pulse" />
            <p>Loading conversations...</p>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No conversations yet</p>
            <p className="text-xs text-gray-500 mt-2">
              Start a conversation by clicking the + button
            </p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <Link
              key={thread.id}
              href={`/dashboard/messages/${thread.id}`}
              className={`block p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                selectedThreadId === thread.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Avatar & Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {thread.participantName}
                    </h3>
                    {isThreadParticipantOnline(thread) && (
                      <span
                        className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
                        title="Online"
                      />
                    )}
                    {thread.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{thread.lastMessage}</p>
                </div>

                {/* Time & Actions */}
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {thread.lastMessageTime}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleArchiveThread(thread.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Archive conversation"
                  >
                    <Archive className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Compose Button (Floating) */}
      <button className="absolute bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
        <Send className="w-6 h-6" />
      </button>
    </div>
  );
}
