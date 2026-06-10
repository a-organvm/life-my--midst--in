'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CloudStorageIntegration } from '@in-midst-my-life/schema';
import { IntegrationCard } from '../../../components/artifacts/IntegrationCard';
import { OAuthFlowHandler } from '../../../components/artifacts/OAuthFlowHandler';
import { Plus } from 'lucide-react';

const apiBase = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001';

export default function IntegrationsPage() {
  const [profileId, setProfileId] = useState<string>('');
  const [integrations, setIntegrations] = useState<CloudStorageIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google_drive' | 'icloud' | 'dropbox'>(
    'google_drive',
  );

  const loadIntegrations = useCallback(async (pid: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/profiles/${pid}/integrations`);
      const data = (await response.json()) as { ok: boolean; data: CloudStorageIntegration[] };

      if (data.ok) {
        setIntegrations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get('profileId') || '';
    setProfileId(pid);
    if (pid) {
      void loadIntegrations(pid);
    }
  }, [loadIntegrations]);

  const handleRefresh = async (integrationId: string) => {
    try {
      await fetch(`${apiBase}/profiles/${profileId}/integrations/${integrationId}/sync`, {
        method: 'POST',
      });
      void loadIntegrations(profileId);
    } catch (err) {
      console.error('Failed to refresh integration:', err);
      throw err;
    }
  };

  const handleConfigure = (integrationId: string) => {
    console.log('Configure integration:', integrationId);
    alert('Configuration UI coming soon!');
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      await fetch(`${apiBase}/profiles/${profileId}/integrations/${integrationId}`, {
        method: 'DELETE',
      });
      void loadIntegrations(profileId);
    } catch (err) {
      console.error('Failed to disconnect integration:', err);
      throw err;
    }
  };

  const handleConnect = (provider: 'google_drive' | 'icloud' | 'dropbox') => {
    setSelectedProvider(provider);
    setShowConnectModal(true);
  };

  const handleConnectionComplete = () => {
    setShowConnectModal(false);
    void loadIntegrations(profileId);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="hero-title" style={{ marginBottom: '0.5rem' }}>
            Cloud Storage Integrations
          </h1>
          <p className="text-muted">
            Connect your cloud storage to automatically discover and sync artifacts
          </p>
        </div>

        {showConnectModal && (
          <div style={{ marginBottom: '2rem' }}>
            <OAuthFlowHandler
              provider={selectedProvider}
              profileId={profileId}
              apiBase={apiBase}
              onComplete={handleConnectionComplete}
            />
          </div>
        )}

        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>
            Add New Integration
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="button button-primary"
              onClick={() => handleConnect('google_drive')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} />
              Connect Google Drive
            </button>
            <button
              className="button button-primary"
              onClick={() => handleConnect('icloud')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} />
              Connect iCloud
            </button>
            <button
              className="button button-primary"
              onClick={() => handleConnect('dropbox')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} />
              Connect Dropbox
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="text-muted">Loading integrations...</p>
          </div>
        ) : integrations.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="text-muted">No integrations connected yet.</p>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                marginTop: '0.5rem',
              }}
            >
              Connect a cloud storage provider above to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onRefresh={handleRefresh}
                onConfigure={handleConfigure}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
