'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Send, MoreVertical, ArrowLeft } from 'lucide-react';
import { useWebSocketMessaging } from '../hooks/useWebSocketMessaging';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
  pinned?: boolean;
}

interface MessageThreadProps {
  threadId: string;
  participantName: string;
  participantId?: string;
  onBack: () => void;
}

export default function MessageThread({
  threadId,
  participantName,
  participantId,
  onBack,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [localTyping, setLocalTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { connected, typingUserIds, isUserOnline, sendTyping } = useWebSocketMessaging(threadId, {
    userId: 'current-user',
  });

  const isParticipantOnline = participantId ? isUserOnline(participantId) : false;

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/messages/threads/${threadId}`);
      if (response.ok) {
        const data = (await response.json()) as { messages: Message[] };
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending) return;

    setIsSending(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          content: newMessage,
          type: 'text',
        }),
      });

      if (response.ok) {
        const sentMessage = (await response.json()) as { id: string };

        setMessages((prev) => [
          ...prev,
          {
            id: sentMessage.id,
            senderId: 'current-user',
            senderName: 'You',
            content: newMessage,
            createdAt: new Date().toISOString(),
            isOwn: true,
          },
        ]);

        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    if (!localTyping && e.target.value && connected) {
      setLocalTyping(true);
      sendTyping();
    }

    if (localTypingTimerRef.current) {
      clearTimeout(localTypingTimerRef.current);
    }
    localTypingTimerRef.current = setTimeout(() => {
      setLocalTyping(false);
    }, 3000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="font-bold text-gray-900">{participantName}</h2>
            <p className="text-xs text-gray-600">
              {connected ? (isParticipantOnline ? 'Active now' : 'Offline') : 'Connecting...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-gray-600">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs text-gray-500 mt-1">Start the conversation below</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showTimestamp =
              index === 0 ||
              (prevMessage &&
                new Date(prevMessage.createdAt).getTime() - new Date(message.createdAt).getTime() >
                  300000);

            return (
              <div key={message.id}>
                {showTimestamp && (
                  <div className="flex justify-center mb-4">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex gap-3 ${message.isOwn ? 'justify-end' : ''}`}>
                  {!message.isOwn && (
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex-shrink-0"></div>
                  )}

                  <div
                    className={`max-w-md px-4 py-2 rounded-lg break-words group ${
                      message.isOwn
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>

                  {message.isOwn && (
                    <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {typingUserIds.length > 0 && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-200 flex-shrink-0"></div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <textarea
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
