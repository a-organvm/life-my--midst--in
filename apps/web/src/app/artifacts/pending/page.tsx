'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Artifact } from '@in-midst-my-life/schema';
import { ArtifactGrid } from '../../../components/artifacts/ArtifactGrid';
import { BulkActions } from '../../../components/artifacts/BulkActions';
import { Filter } from 'lucide-react';

const apiBase = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001';

export default function PendingArtifactsPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string>('');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');

  const loadArtifacts = useCallback(async (pid: string) => {
    setLoading(true);
    try {
      const url = `${apiBase}/profiles/${pid}/artifacts/pending`;
      const response = await fetch(url);
      const data = (await response.json()) as { ok: boolean; data: Artifact[] };

      if (data.ok) {
        setArtifacts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load artifacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get('profileId') || '';
    setProfileId(pid);
    if (pid) {
      void loadArtifacts(pid);
    }
  }, [loadArtifacts]);

  const handleSelectArtifact = (artifactId: string) => {
    router.push(`/artifacts/${artifactId}?profileId=${profileId}`);
  };

  const handleApproveAll = async () => {
    for (const id of selectedIds) {
      try {
        await fetch(`${apiBase}/profiles/${profileId}/artifacts/${id}/approve`, {
          method: 'POST',
        });
      } catch (err) {
        console.error(`Failed to approve ${id}:`, err);
      }
    }
    setSelectedIds(new Set());
    void loadArtifacts(profileId);
  };

  const handleRejectAll = async () => {
    for (const id of selectedIds) {
      try {
        await fetch(`${apiBase}/profiles/${profileId}/artifacts/${id}/reject`, {
          method: 'POST',
        });
      } catch (err) {
        console.error(`Failed to reject ${id}:`, err);
      }
    }
    setSelectedIds(new Set());
    void loadArtifacts(profileId);
  };

  const handleArchiveAll = async () => {
    for (const id of selectedIds) {
      try {
        await fetch(`${apiBase}/profiles/${profileId}/artifacts/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error(`Failed to archive ${id}:`, err);
      }
    }
    setSelectedIds(new Set());
    void loadArtifacts(profileId);
  };

  const filteredArtifacts =
    filterType === 'all' ? artifacts : artifacts.filter((a) => a.artifactType === filterType);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="hero-title" style={{ marginBottom: '0.5rem' }}>
            Pending Artifacts
          </h1>
          <p className="text-muted">
            Review and approve artifacts discovered from your cloud storage
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Filter size={20} />
            <span className="label">Filter by type:</span>
            <select
              className="input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ maxWidth: '250px' }}
            >
              <option value="all">All Types</option>
              <option value="academic_paper">Academic Papers</option>
              <option value="creative_writing">Creative Writing</option>
              <option value="visual_art">Visual Art</option>
              <option value="presentation">Presentations</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="code_sample">Code Samples</option>
              <option value="dataset">Datasets</option>
            </select>
            <span className="text-muted">
              {filteredArtifacts.length} artifact{filteredArtifacts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <ArtifactGrid
          artifacts={filteredArtifacts}
          onSelectArtifact={handleSelectArtifact}
          loading={loading}
        />

        <BulkActions
          selectedCount={selectedIds.size}
          onApproveAll={handleApproveAll}
          onRejectAll={handleRejectAll}
          onArchiveAll={handleArchiveAll}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      </div>
    </div>
  );
}
