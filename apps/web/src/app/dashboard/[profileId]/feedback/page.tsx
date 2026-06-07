'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Bug,
  Lightbulb,
  TrendingUp,
  MessageCircle,
} from 'lucide-react';
import FeedbackForm from '@/components/FeedbackForm';

interface Feedback {
  id: string;
  category: 'bug' | 'feature-request' | 'improvement' | 'other';
  subject: string;
  status: 'new' | 'reviewed' | 'in-progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

const STATUS_BADGES = {
  new: {
    icon: <MessageCircle className="w-4 h-4" />,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    label: 'New',
  },
  reviewed: {
    icon: <Clock className="w-4 h-4" />,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    label: 'Under Review',
  },
  'in-progress': {
    icon: <Zap className="w-4 h-4" />,
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    label: 'In Progress',
  },
  resolved: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    label: 'Resolved',
  },
};

const CATEGORY_ICONS = {
  bug: <Bug className="w-4 h-4 text-red-600" />,
  'feature-request': <Lightbulb className="w-4 h-4 text-blue-600" />,
  improvement: <TrendingUp className="w-4 h-4 text-green-600" />,
  other: <MessageCircle className="w-4 h-4 text-gray-600" />,
};

export default function FeedbackPage({ params }: { params: { profileId: string } }) {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadFeedback = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/feedback?limit=100&offset=0`);
      if (response.ok) {
        const data = (await response.json()) as { items: Feedback[] };
        setFeedbackList(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
  }, [params.profileId, loadFeedback]);

  const filteredFeedback = feedbackList.filter(
    (f) => filterStatus === 'all' || f.status === filterStatus,
  );

  const stats = {
    total: feedbackList.length,
    new: feedbackList.filter((f) => f.status === 'new').length,
    resolved: feedbackList.filter((f) => f.status === 'resolved').length,
    inProgress: feedbackList.filter((f) => f.status === 'in-progress').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Feedback & Support</h1>
          <p className="text-gray-600">
            Help us improve by sharing your experiences. Every piece of feedback helps shape the
            future of in–midst–my–life.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Feedback</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">New</p>
                <p className="text-3xl font-bold text-gray-900">{stats.new}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Resolved</p>
                <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Share Your Feedback</h2>
              <FeedbackForm
                profileId={params.profileId}
                userId="current-user-id" // In production, use actual user ID from auth
                onSubmitSuccess={() => {
                  void loadFeedback();
                }}
              />
            </div>
          </div>

          {/* Right Column: Feedback List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Filter */}
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Your Feedback</h2>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'new', 'reviewed', 'in-progress', 'resolved'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filterStatus === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback List */}
              <div className="divide-y divide-gray-200">
                {isLoading ? (
                  <div className="p-6 text-center text-gray-600">
                    <p>Loading feedback...</p>
                  </div>
                ) : filteredFeedback.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">
                      {feedbackList.length === 0
                        ? 'No feedback yet. Share your thoughts above!'
                        : 'No feedback with this status.'}
                    </p>
                  </div>
                ) : (
                  filteredFeedback.map((feedback) => {
                    const badge = STATUS_BADGES[feedback.status];
                    return (
                      <div key={feedback.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {CATEGORY_ICONS[feedback.category]}
                              <h3 className="font-semibold text-gray-900">{feedback.subject}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.border} border ${badge.text}`}
                              >
                                {badge.icon}
                                {badge.label}
                              </span>
                              <span className="text-xs text-gray-600">
                                {new Date(feedback.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Information Cards */}
            <div className="mt-8 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900">What happens to your feedback?</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      All feedback is reviewed by our team. We prioritize based on impact and
                      frequency. You'll see status updates as we work on your suggestions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900">
                      Thank you for being a beta tester
                    </h4>
                    <p className="text-sm text-green-800 mt-1">
                      Your insights help us build a better product. This is a collaborative journey,
                      and your voice matters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
