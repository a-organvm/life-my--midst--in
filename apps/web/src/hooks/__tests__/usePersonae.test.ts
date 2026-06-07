import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePersonae } from '../usePersonae';
import type { TabulaPersonarumEntry, PersonaResonance } from '@in-midst-my-life/schema';

global.fetch = vi.fn();

const mockPersonas: TabulaPersonarumEntry[] = [
  {
    id: 'persona-1',
    nomen: 'Archimago',
    everyday_name: 'Engineer',
    role_vector: 'Builds systems',
    tone_register: 'Analytical',
    visibility_scope: ['Technica'],
    motto: 'Via ratio',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'persona-2',
    nomen: 'Artifex',
    everyday_name: 'Artist',
    role_vector: 'Creates',
    tone_register: 'Expressive',
    visibility_scope: ['Artistica'],
    motto: 'Creatio est vita',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockResonances: PersonaResonance[] = [
  {
    persona_id: 'persona-1',
    context: 'Technical',
    fit_score: 92,
    alignment_keywords: ['systems', 'architecture'],
  },
];

describe('usePersonae', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with loading state', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { result } = renderHook(() => usePersonae('profile-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.personas).toEqual([]);
    expect(result.current.resonances).toEqual([]);
  });

  it('fetches personas and resonances on mount', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/personae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: mockPersonas }),
        });
      }
      if (url.includes('/resonances')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ resonances: mockResonances }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePersonae('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.personas).toHaveLength(2);
    expect(result.current.resonances).toHaveLength(1);
  });

  it('filters out inactive personas by default', async () => {
    const inactivePersonas = [
      ...mockPersonas,
      {
        ...mockPersonas[0],
        id: 'persona-3',
        active: false,
      },
    ];

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/personae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: inactivePersonas }),
        });
      }
      if (url.includes('/resonances')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ resonances: mockResonances }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePersonae('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.personas).toHaveLength(2);
    expect(result.current.personas.every((p) => p.active)).toBe(true);
  });

  it('auto-selects first persona if none provided', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/personae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: mockPersonas }),
        });
      }
      if (url.includes('/resonances')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ resonances: mockResonances }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePersonae('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.selectedPersonaId).toBe('persona-1');
  });

  it('respects provided selectedPersonaId', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/personae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: mockPersonas }),
        });
      }
      if (url.includes('/resonances')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ resonances: mockResonances }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePersonae('profile-1', 'persona-2'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.selectedPersonaId).toBe('persona-2');
  });

  it('provides function to select different persona', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/personae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: mockPersonas }),
        });
      }
      if (url.includes('/resonances')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ resonances: mockResonances }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePersonae('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.selectedPersonaId).toBe('persona-1');

    await act(async () => {
      result.current.selectPersona('persona-2');
    });

    expect(result.current.selectedPersonaId).toBe('persona-2');
  });

  it('provides function to get current selected persona', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/personae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: mockPersonas }),
        });
      }
      if (url.includes('/resonances')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ resonances: mockResonances }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePersonae('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const selected = result.current.getSelectedPersona();
    expect(selected?.id).toBe('persona-1');
    expect(selected?.nomen).toBe('Archimago');
  });

  it('provides function to add new persona', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/personae') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'persona-3',
            nomen: 'Sophistes',
            everyday_name: 'Philosopher',
            role_vector: 'Thinks deeply',
            tone_register: 'Contemplative',
            visibility_scope: ['Academica'],
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });
      }
      if (url.includes('/personae') && options.method !== 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: mockPersonas }),
        });
      }
      if (url.includes('/resonances')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ resonances: mockResonances }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePersonae('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let newPersona: any;
    await act(async () => {
      newPersona = await result.current.addPersona({
        nomen: 'Sophistes',
        everyday_name: 'Philosopher',
        role_vector: 'Thinks deeply',
        tone_register: 'Contemplative',
        visibility_scope: ['Academica'],
        active: true,
      });
    });

    expect(newPersona).toBeDefined();
    expect(newPersona?.nomen).toBe('Sophistes');
  });

  it('provides function to update persona', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/personae/persona-1') && options.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockPersonas[0],
            everyday_name: 'Senior Engineer',
          }),
        });
      }
      if (url.includes('/personae') && options.method !== 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: mockPersonas }),
        });
      }
      if (url.includes('/resonances')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ resonances: mockResonances }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePersonae('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updatePersona('persona-1', {
        everyday_name: 'Senior Engineer',
      });
    });

    expect(updated?.everyday_name).toBe('Senior Engineer');
  });

  it('provides function to delete persona', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/personae/persona-1') && options.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/personae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: mockPersonas }),
        });
      }
      if (url.includes('/resonances')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ resonances: mockResonances }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePersonae('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let deleted: any;
    await act(async () => {
      deleted = await result.current.deletePersona('persona-1');
    });
    expect(deleted).toBe(true);
  });

  it('provides function to get resonances for a persona', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/personae')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: mockPersonas }),
        });
      }
      if (url.includes('/resonances')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ resonances: mockResonances }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePersonae('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const resonances = result.current.getPersonaResonances('persona-1');
    expect(resonances).toHaveLength(1);
    expect(resonances[0]!.context).toBe('Technical');
  });

  it('handles fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePersonae('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.personas).toHaveLength(0);
  });
});
