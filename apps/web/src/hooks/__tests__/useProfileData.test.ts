import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProfileData } from '../useProfileData';
import type { CVEntry } from '@in-midst-my-life/schema';

// Test mock interface - allows legacy test properties alongside schema fields
interface TestProfile {
  id: string;
  identityId?: string;
  slug?: string;
  displayName?: string;
  name?: string; // Legacy alias for displayName
  email?: string;
  summary?: string; // Legacy alias for summaryMarkdown
  createdAt?: string;
  updatedAt?: string;
}

// Mock fetch
global.fetch = vi.fn();

const mockProfile: TestProfile = {
  id: 'profile-1',
  identityId: 'user-1',
  slug: 'john-doe',
  displayName: 'John Doe',
  name: 'John Doe', // Legacy alias for test assertions
  email: 'john@example.com',
  summary: 'Complete person with many capabilities',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCVData = {
  id: 'cv-1',
  profileId: 'profile-1',
  version: 1,
  entries: [] as CVEntry[],
};

describe('useProfileData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with loading state', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { result } = renderHook(() => useProfileData('profile-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.profile).toBeNull();
    expect(result.current.cv).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches profile and CV data on mount', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/profiles/profile-1') && !url.includes('/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ profile: mockProfile }),
        });
      }
      if (url.includes('/profiles/profile-1/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCVData,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useProfileData('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.cv).toEqual(mockCVData);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors gracefully', async () => {
    const errorMessage = 'Network error';
    (global.fetch as any).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useProfileData('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toContain(errorMessage);
    expect(result.current.profile).toBeNull();
    expect(result.current.cv).toBeNull();
  });

  it('provides refetch function to reload data', async () => {
    let callCount = 0;
    (global.fetch as any).mockImplementation((url: string) => {
      callCount++;
      if (url.includes('/profiles/profile-1') && !url.includes('/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ profile: { ...mockProfile, name: `Name ${callCount}` } }),
        });
      }
      if (url.includes('/profiles/profile-1/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCVData,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useProfileData('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialName = (result.current.profile as any)?.name;

    // Call refetch
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect((result.current.profile as any)?.name).not.toBe(initialName);
    });
  });

  it('provides addEntry function to create new CV entries', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/profiles/profile-1') && !url.includes('/cv') && !options?.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ profile: mockProfile }),
        });
      }
      if (url.includes('/profiles/profile-1/cv') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'entry-1',
            type: 'experience',
            content: 'New entry',
          }),
        });
      }
      if (url.includes('/profiles/profile-1/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCVData,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useProfileData('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let newEntry: any;
    await act(async () => {
      newEntry = await result.current.addEntry({
        type: 'experience',
        content: 'New entry',
      });
    });

    expect(newEntry).toBeDefined();
    expect(newEntry?.type).toBe('experience');
  });

  it('provides updateEntry function to modify existing entries', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/profiles/profile-1') && !url.includes('/cv') && !options?.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ profile: mockProfile }),
        });
      }
      if (url.includes('/profiles/profile-1/cv/entries/entry-1') && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'entry-1',
            type: 'achievement',
            content: 'Updated entry',
          }),
        });
      }
      if (url.includes('/profiles/profile-1/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCVData,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useProfileData('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateEntry('entry-1', {
        type: 'achievement',
        content: 'Updated entry',
      });
    });

    expect(updated).toBeDefined();
    expect(updated?.type).toBe('achievement');
  });

  it('provides deleteEntry function', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/profiles/profile-1') && !url.includes('/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ profile: mockProfile }),
        });
      }
      if (url.includes('/profiles/profile-1/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCVData,
        });
      }
      if (url.includes('DELETE') && url.includes('/entries/entry-1')) {
        return Promise.resolve({ ok: true });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useProfileData('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let deleted: any;
    await act(async () => {
      deleted = await result.current.deleteEntry('entry-1');
    });

    expect(deleted).toBe(true);
  });

  it('provides filterEntries function with CVFilter', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/profiles/profile-1') && !url.includes('/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ profile: mockProfile }),
        });
      }
      if (url.includes('/profiles/profile-1/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCVData,
        });
      }
      if (url.includes('POST') && url.includes('/filter')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [], total: 0 }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useProfileData('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.filterEntries({
        includePersonae: ['persona-1'],
        minPriority: 70,
      });
    });

    // Verify filter was called
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/filter'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('handles invalid profile ID', async () => {
    (global.fetch as any).mockRejectedValue(new Error('404: Not found'));

    const { result } = renderHook(() => useProfileData('invalid-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.profile).toBeNull();
  });

  it('sets loading to false after successful fetch', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/profiles/profile-1') && !url.includes('/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ profile: mockProfile }),
        });
      }
      if (url.includes('/profiles/profile-1/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCVData,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useProfileData('profile-1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('maintains referential stability for functions', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/profiles/profile-1') && !url.includes('/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ profile: mockProfile }),
        });
      }
      if (url.includes('/profiles/profile-1/cv')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCVData,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result, rerender } = renderHook(() => useProfileData('profile-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const refetchFn = result.current.refetch;
    const addEntryFn = result.current.addEntry;

    rerender();

    // Functions should maintain same reference
    expect(result.current.refetch).toBe(refetchFn);
    expect(result.current.addEntry).toBe(addEntryFn);
  });
});
