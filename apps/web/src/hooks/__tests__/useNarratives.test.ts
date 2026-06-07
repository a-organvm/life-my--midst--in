import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNarratives } from '../useNarratives';

// Test mock interface - matches PersistedNarrativeBlock (id and content required)
interface TestNarrativeBlock {
  id: string;
  title: string;
  content: string;
  body: string;
  weight?: number;
  priority?: number;
  tags?: string[];
  theatrical_metadata?: {
    aetas?: string;
    mask_name?: string;
    scaena?: string;
    performance_note?: string;
    authentic_caveat?: string;
  };
  templateId?: string;
}

global.fetch = vi.fn();

const mockNarrativeBlocks: TestNarrativeBlock[] = [
  {
    id: 'block-1',
    title: 'Technical Journey',
    body: 'Started coding at 14...',
    content: 'Started coding at 14...',
    weight: 85,
    theatrical_metadata: {
      scaena: 'scaena-1',
      performance_note: 'Technical depth',
      authentic_caveat: 'Emphasizes technical skills',
    },
  },
];

describe('useNarratives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with loading state', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { result } = renderHook(() => useNarratives('profile-1', 'persona-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.narrativeBlocks).toEqual([]);
    expect(result.current.theatricalPreamble).toBeNull();
  });

  it('fetches narrative blocks for selected persona', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/narrative/persona-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: mockNarrativeBlocks,
            preamble: 'The following presents me as Engineer',
            disclaimer: 'Emphasizes technical work',
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNarratives('profile-1', 'persona-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.narrativeBlocks).toHaveLength(1);
    expect(result.current.theatricalPreamble).toContain('Engineer');
  });

  it('updates narratives when persona changes', async () => {
    let callCount = 0;
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/narrative/persona-1')) {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: mockNarrativeBlocks,
            preamble: `Persona 1 - Call ${callCount}`,
            disclaimer: 'Emphasizes technical',
          }),
        });
      }
      if (url.includes('/narrative/persona-2')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: [
              {
                ...mockNarrativeBlocks[0],
                title: 'Artistic Journey',
              },
            ],
            preamble: 'The following presents me as Artist',
            disclaimer: 'Emphasizes creative',
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result, rerender } = renderHook(
      ({ personaId }) => useNarratives('profile-1', personaId),
      { initialProps: { personaId: 'persona-1' } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const preamble1 = result.current.theatricalPreamble;

    // Change persona
    rerender({ personaId: 'persona-2' });

    await waitFor(() => {
      expect(result.current.theatricalPreamble).not.toBe(preamble1);
    });

    expect(result.current.theatricalPreamble).toContain('Artist');
  });

  it('provides function to generate narratives for a mask', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/narrative/persona-1') && !options.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: mockNarrativeBlocks,
            preamble: 'Original',
            disclaimer: 'Original',
          }),
        });
      }
      if (url.includes('/narrative/persona-1') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: [
              ...mockNarrativeBlocks,
              {
                id: 'block-2',
                title: 'Generated Block',
                body: 'AI generated content',
                content: 'AI generated content',
                weight: 70,
                theatrical_metadata: {},
              },
            ],
            preamble: 'Generated preamble',
            disclaimer: 'Generated disclaimer',
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNarratives('profile-1', 'persona-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let generated: any;
    await act(async () => {
      generated = await result.current.generateNarratives();
    });
    expect(generated).toBeDefined();
    expect(generated?.blocks?.length).toBeGreaterThan(0);
  });

  it('provides function to update narrative block', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/narrative/persona-1/block-1') && options.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'block-1',
            title: 'Updated Title',
            body: 'Updated content',
            content: 'Updated content',
            weight: 90,
            theatrical_metadata: {
              scaena: 'scaena-2',
            },
          }),
        });
      }
      if (url.includes('/narrative/persona-1') && !options.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: mockNarrativeBlocks,
            preamble: 'Preamble',
            disclaimer: 'Disclaimer',
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNarratives('profile-1', 'persona-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateBlock('block-1', {
        title: 'Updated Title',
        weight: 90,
      });
    });

    expect(updated?.title).toBe('Updated Title');
    expect(updated?.weight).toBe(90);
  });

  it('provides function to delete narrative block', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/narrative/persona-1/block-1') && options.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/narrative/persona-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: mockNarrativeBlocks,
            preamble: 'Preamble',
            disclaimer: 'Disclaimer',
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNarratives('profile-1', 'persona-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let deleted: any;
    await act(async () => {
      deleted = await result.current.deleteBlock('block-1');
    });
    expect(deleted).toBe(true);
  });

  it('provides function to save all narratives', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/narrative/persona-1') && options.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: mockNarrativeBlocks,
            preamble: 'Saved preamble',
            disclaimer: 'Saved disclaimer',
          }),
        });
      }
      if (url.includes('/narrative/persona-1') && !options.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: mockNarrativeBlocks,
            preamble: 'Original',
            disclaimer: 'Original',
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNarratives('profile-1', 'persona-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let saved: any;
    await act(async () => {
      saved = await result.current.saveNarratives(
        mockNarrativeBlocks,
        'Saved preamble',
        'Saved disclaimer',
      );
    });

    expect(saved).toBeDefined();
  });

  it('provides function to get block by ID', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/narrative/persona-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: mockNarrativeBlocks,
            preamble: 'Preamble',
            disclaimer: 'Disclaimer',
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNarratives('profile-1', 'persona-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const block = result.current.getBlock('block-1');
    expect(block).toBeDefined();
    expect(block?.title).toBe('Technical Journey');
  });

  it('provides function to reorder blocks', async () => {
    const blocks = [
      { ...mockNarrativeBlocks[0], id: 'block-1', weight: 85 },
      { ...mockNarrativeBlocks[0], id: 'block-2', weight: 75 },
      { ...mockNarrativeBlocks[0], id: 'block-3', weight: 65 },
    ];

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/narrative/persona-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks,
            preamble: 'Preamble',
            disclaimer: 'Disclaimer',
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNarratives('profile-1', 'persona-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Reorder by moving block-2 to end
    let reordered: any;
    act(() => {
      reordered = result.current.reorderBlocks(['block-1', 'block-3', 'block-2']);
    });
    expect((reordered[2] as any).id).toBe('block-2');
  });

  it('handles fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNarratives('profile-1', 'persona-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.narrativeBlocks).toHaveLength(0);
  });

  it('provides theatrical metadata with each block', async () => {
    const blockWithMetadata: TestNarrativeBlock = {
      id: 'block-1',
      title: 'Title',
      body: 'Content',
      content: 'Content',
      weight: 80,
      theatrical_metadata: {
        scaena: 'scaena-1',
        performance_note: 'Note',
        authentic_caveat: 'Caveat',
      },
    };

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/narrative/persona-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blocks: [blockWithMetadata],
            preamble: 'Preamble',
            disclaimer: 'Disclaimer',
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNarratives('profile-1', 'persona-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const block = result.current.getBlock('block-1');
    expect(block?.theatrical_metadata).toBeDefined();
    expect(block?.theatrical_metadata?.scaena).toBe('scaena-1');
  });
});
