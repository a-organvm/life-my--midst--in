'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Artifact } from '@in-midst-my-life/schema';
import { ArtifactPreview } from '../../../components/artifacts/ArtifactPreview';
import { MetadataEditor } from '../../../components/artifacts/MetadataEditor';
import { LLMSuggestions } from '../../../components/artifacts/LLMSuggestions';
import { ArrowLeft, Check, X, Archive } from 'lucide-react';

const apiBase = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001';

export default function ArtifactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [profileId, setProfileId] = useState<string>('');
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);

  const loadArtifact = useCallback(async (pid: string, artifactId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/profiles/${pid}/artifacts/${artifactId}`);
      const data = (await response.json()) as { ok: boolean; data: Artifact };

      if (data.ok) {
        setArtifact(data.data);
      }
    } catch (err) {
      console.error('Failed to load artifact:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get('profileId') || '';
    setProfileId(pid);
    if (pid && params['id']) {
      void loadArtifact(pid, params['id'] as string);
    }
  }, [params, loadArtifact]);

  const handleSave = async (updates: Partial<Artifact>) => {
    if (!artifact) return;

    try {
      const response = await fetch(`${apiBase}/profiles/${profileId}/artifacts/${artifact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = (await response.json()) as { ok: boolean };
      if (data.ok) {
        setArtifact({ ...artifact, ...updates });
      }
    } catch (err) {
      console.error('Failed to save artifact:', err);
      throw err;
    }
  };

  const handleApprove = async () => {
    if (!artifact) return;

    try {
      await fetch(`${apiBase}/profiles/${profileId}/artifacts/${artifact.id}/approve`, {
        method: 'POST',
      });
      router.push(`/artifacts/pending?profileId=${profileId}`);
    } catch (err) {
      console.error('Failed to approve artifact:', err);
    }
  };

  const handleReject = async () => {
    if (!artifact) return;

    try {
      await fetch(`${apiBase}/profiles/${profileId}/artifacts/${artifact.id}/reject`, {
        method: 'POST',
      });
      router.push(`/artifacts/pending?profileId=${profileId}`);
    } catch (err) {
      console.error('Failed to reject artifact:', err);
    }
  };

  const handleArchive = async () => {
    if (!artifact) return;

    if (!confirm('Are you sure you want to archive this artifact?')) {
      return;
    }

    try {
      await fetch(`${apiBase}/profiles/${profileId}/artifacts/${artifact.id}`, {
        method: 'DELETE',
      });
      router.push(`/artifacts/pending?profileId=${profileId}`);
    } catch (err) {
      console.error('Failed to archive artifact:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', padding: '2rem' }}>
        <p className="text-muted">Loading artifact...</p>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', padding: '2rem' }}>
        <p className="text-muted">Artifact not found</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <button
          className="button"
          onClick={() => router.push(`/artifacts/pending?profileId=${profileId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}
        >
          <ArrowLeft size={16} />
          Back to Pending
        </button>

        <div style={{ marginBottom: '2rem' }}>
          <h1 className="hero-title" style={{ marginBottom: '0.5rem' }}>
            {artifact.title || artifact.name}
          </h1>
          <p className="text-muted">
            {artifact.sourceProvider} • Captured{' '}
            {new Date(artifact.capturedDate).toLocaleDateString()}
          </p>
        </div>

        {artifact.status === 'pending' && (
          <div className="card" style={{ padding: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="button button-success"
                onClick={handleApprove}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Check size={16} />
                Approve
              </button>
              <button
                className="button button-danger"
                onClick={handleReject}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <X size={16} />
                Reject
              </button>
              <button
                className="button"
                onClick={handleArchive}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Archive size={16} />
                Archive
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          <div>
            <ArtifactPreview artifact={artifact} apiBase={apiBase} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <LLMSuggestions artifact={artifact} />
            <MetadataEditor artifact={artifact} onSave={handleSave} />
          </div>
        </div>
      </div>
    </div>
  );
}
