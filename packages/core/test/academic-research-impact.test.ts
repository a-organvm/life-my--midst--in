import { describe, it, expect } from 'vitest';
import {
  computeHIndex,
  computeI10Index,
  computeResearchImpact,
} from '../src/academic/research-impact';
import type { ScholarlyWork } from '@in-midst-my-life/schema';

const work = (over: Partial<ScholarlyWork>): ScholarlyWork => ({
  id: '00000000-0000-0000-0000-000000000000',
  title: 'A Work',
  type: 'journal-article',
  year: 2020,
  citations: 0,
  status: 'published',
  peerReviewed: true,
  ...over,
});

describe('computeHIndex', () => {
  it('returns 0 for an empty list', () => {
    expect(computeHIndex([])).toBe(0);
  });

  it('computes the textbook h-index', () => {
    // 14 papers each cited 14 times → h-index 14
    expect(computeHIndex(new Array(14).fill(14))).toBe(14);
  });

  it('computes h from an uneven citation distribution', () => {
    // sorted desc [10,8,5,4,3]: 4 papers have >= 4 citations, 5th has only 3
    expect(computeHIndex([3, 10, 5, 8, 4])).toBe(4);
  });

  it('is bounded by the number of papers', () => {
    expect(computeHIndex([100, 100])).toBe(2);
  });
});

describe('computeI10Index', () => {
  it('counts works with at least 10 citations', () => {
    expect(computeI10Index([9, 10, 11, 100, 0])).toBe(3);
  });
});

describe('computeResearchImpact', () => {
  it('excludes non-citable works from the bibliometric denominators', () => {
    const works: ScholarlyWork[] = [
      work({ id: '1'.padStart(36, '0'), citations: 20, status: 'published' }),
      work({ id: '2'.padStart(36, '0'), citations: 15, status: 'in-press' }),
      work({ id: '3'.padStart(36, '0'), citations: 0, status: 'under-review' }),
      work({ id: '4'.padStart(36, '0'), citations: 0, status: 'in-preparation' }),
    ];
    const metrics = computeResearchImpact(works);
    expect(metrics.totalPublications).toBe(2); // published + in-press only
    expect(metrics.totalCitations).toBe(35);
    expect(metrics.hIndex).toBe(2);
    expect(metrics.i10Index).toBe(2);
    expect(metrics.meanCitations).toBe(17.5);
  });

  it('counts first/sole/corresponding author works', () => {
    const works: ScholarlyWork[] = [
      work({ id: '1'.padStart(36, '0'), authorPosition: 'first', citations: 5 }),
      work({ id: '2'.padStart(36, '0'), authorPosition: 'corresponding', citations: 5 }),
      work({ id: '3'.padStart(36, '0'), authorPosition: 'middle', citations: 5 }),
    ];
    expect(computeResearchImpact(works).firstAuthorCount).toBe(2);
  });

  it('returns zeroed metrics for an empty ledger', () => {
    const metrics = computeResearchImpact([]);
    expect(metrics.hIndex).toBe(0);
    expect(metrics.totalPublications).toBe(0);
    expect(metrics.meanCitations).toBe(0);
  });
});
