import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useScaenae } from '../useScaenae';

global.fetch = vi.fn();

// Test mock data - uses relaxed typing to allow legacy/extended test properties
// The hook itself handles mapping between API response and schema types
interface TestScaena {
  id: string;
  name?: string;
  nomen?: string; // Legacy alias for name
  emoji?: string;
  description: string;
  immutable?: boolean;
  canonical?: boolean;
  latin_name?: string;
  audience?: string;
  formality_level?: string;
  visibility?: string;
  metadata?: { canonical?: boolean };
  created_at?: Date;
  updated_at?: Date;
}

const mockCanonicalScaenae: TestScaena[] = [
  {
    id: 'scaena-1',
    name: 'Technica',
    emoji: '⚙️',
    description: 'Technical stage',
    immutable: true,
    canonical: true,
  },
  {
    id: 'scaena-2',
    name: 'Artistica',
    emoji: '🎨',
    description: 'Artistic stage',
    immutable: true,
    canonical: true,
  },
];

describe('useScaenae', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with loading state', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { result } = renderHook(() => useScaenae());

    expect(result.current.loading).toBe(true);
    expect(result.current.canonicalScaenae).toEqual([]);
    expect(result.current.customScaenae).toEqual([]);
  });

  it('fetches canonical scaenae (6 immutable stages)', async () => {
    const sixCanonical = Array.from({ length: 6 }, (_, i) => ({
      ...mockCanonicalScaenae[0],
      id: `scaena-${i}`,
      name: ['Technica', 'Academica', 'Artistica', 'Civica', 'Domestica', 'Occulta'][i],
    }));

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/taxonomy/scaenae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scaenae: sixCanonical }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.canonicalScaenae).toHaveLength(6);
  });

  it('separates canonical (immutable) from custom scaenae', async () => {
    const mixedScaenae = [
      ...mockCanonicalScaenae,
      {
        id: 'scaena-custom-1',
        name: 'Custom',
        emoji: '🎭',
        description: 'Custom stage',
        immutable: false,
        canonical: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/taxonomy/scaenae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scaenae: mixedScaenae }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.canonicalScaenae).toHaveLength(2);
    expect(result.current.customScaenae).toHaveLength(1);
  });

  it('never allows deletion of canonical scaenae', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/taxonomy/scaenae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scaenae: mockCanonicalScaenae }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to delete canonical scaena
    const canDelete = result.current.canDeleteScaena('scaena-1');
    expect(canDelete).toBe(false);
  });

  it('allows deletion of custom scaenae', async () => {
    const customScaena = {
      id: 'scaena-custom-1',
      name: 'Custom',
      emoji: '🎭',
      description: 'Custom stage',
      immutable: false,
      canonical: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/taxonomy/scaenae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scaenae: [customScaena] }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const canDelete = result.current.canDeleteScaena('scaena-custom-1');
    expect(canDelete).toBe(true);
  });

  it('provides scaena emoji lookup', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/taxonomy/scaenae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scaenae: mockCanonicalScaenae }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const emoji = result.current.getScaenaEmoji('scaena-1');
    expect(emoji).toBe('⚙️');
  });

  it('provides scaena label lookup', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/taxonomy/scaenae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scaenae: mockCanonicalScaenae }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const label = result.current.getScaenaLabel('scaena-1');
    expect(label).toBe('Technica');
  });

  it('provides function to create custom scaenae', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/taxonomy/scaenae') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'scaena-custom-1',
            name: 'Workshop',
            emoji: '🏗️',
            description: 'Workshop stage',
            immutable: false,
            canonical: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });
      }
      if (url.includes('/taxonomy/scaenae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scaenae: mockCanonicalScaenae }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let created: any;
    await act(async () => {
      created = await result.current.createCustomScaena({
        nomen: 'Workshop',
        emoji: '🏗️',
        description: 'Workshop stage',
      } as any);
    });

    expect(created).toBeDefined();
    expect((created as any)?.name).toBe('Workshop');
  });

  it('provides function to delete custom scaenae', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/taxonomy/scaenae/scaena-custom-1') && options.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/taxonomy/scaenae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scaenae: mockCanonicalScaenae }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let deleted: any;
    await act(async () => {
      deleted = await result.current.deleteCustomScaena('scaena-custom-1');
    });
    expect(deleted).toBe(true);
  });

  it('handles fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.canonicalScaenae).toHaveLength(0);
  });

  it('provides getAll function combining canonical and custom', async () => {
    const mixedScaenae = [
      ...mockCanonicalScaenae,
      {
        id: 'scaena-custom-1',
        name: 'Custom',
        emoji: '🎭',
        description: 'Custom',
        immutable: false,
        canonical: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/taxonomy/scaenae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scaenae: mixedScaenae }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const all = result.current.getAllScaenae();
    expect(all).toHaveLength(3);
  });

  it('separates canonical 6 immutable stages correctly', async () => {
    const canonicalByType = {
      Technica: '⚙️',
      Academica: '🎓',
      Artistica: '🎨',
      Civica: '🏛️',
      Domestica: '🏠',
      Occulta: '🔮',
    };

    const sixCanonical: TestScaena[] = Object.entries(canonicalByType).map(([name, emoji]) => ({
      id: `scaena-${name}`,
      name,
      emoji,
      description: `${name} stage`,
      immutable: true,
      canonical: true,
    }));

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/taxonomy/scaenae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scaenae: sixCanonical }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScaenae());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.canonicalScaenae).toHaveLength(6);
    // The hook should correctly identify canonical scaenae
    expect(result.current.canonicalScaenae.length).toBeGreaterThan(0);
  });
});
