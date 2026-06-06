/**
 * Research Impact Analysis
 *
 * The academic counterpart to market-rate.ts. Where MarketRateAnalyzer turns a
 * set of salaries into percentile compensation benchmarks, this module turns a
 * set of scholarly works into author-level bibliometrics (h-index, i10-index,
 * citation counts) that feed the academic compatibility analyzer.
 *
 * Definitions follow the standard literature:
 *   - h-index: the largest number h such that h publications have each been
 *     cited at least h times. https://en.wikipedia.org/wiki/H-index
 *   - i10-index: the number of publications with at least 10 citations
 *     (introduced by Google Scholar Citations).
 */

import type { ResearchImpactMetrics, ScholarlyWork } from '@in-midst-my-life/schema';

/**
 * Compute the h-index from a list of per-work citation counts.
 *
 * A scholar has h-index h when h of their works have >= h citations each and
 * the remaining works have <= h citations. Returns 0 for an empty list.
 */
export function computeHIndex(citationCounts: number[]): number {
  if (citationCounts.length === 0) return 0;

  // Sort descending so the i-th paper (1-indexed) is the i-th most cited.
  const sorted = [...citationCounts].sort((a, b) => b - a);

  let h = 0;
  for (let i = 0; i < sorted.length; i++) {
    const citations = sorted[i]!; // safe: i < length
    if (citations >= i + 1) {
      h = i + 1;
    } else {
      break;
    }
  }
  return h;
}

/**
 * Compute the i10-index: the number of works with at least 10 citations.
 */
export function computeI10Index(citationCounts: number[]): number {
  return citationCounts.filter((c) => c >= 10).length;
}

/** An author "lead" position carries the most evaluative weight. */
function isFirstAuthor(work: ScholarlyWork): boolean {
  return (
    work.authorPosition === 'first' ||
    work.authorPosition === 'sole' ||
    work.authorPosition === 'corresponding'
  );
}

/**
 * Compute the full set of author-level impact metrics from a scholar's works.
 *
 * Only counts works that have entered the citation record (published or in
 * press); manuscripts under review / in preparation accrue no citations and are
 * excluded from the bibliometric denominators, matching how Scholar profiles
 * behave.
 */
export function computeResearchImpact(works: ScholarlyWork[]): ResearchImpactMetrics {
  const counted = works.filter((w) => w.status === 'published' || w.status === 'in-press');

  const citationCounts = counted.map((w) => w.citations);
  const totalCitations = citationCounts.reduce((sum, c) => sum + c, 0);
  const totalPublications = counted.length;

  return {
    hIndex: computeHIndex(citationCounts),
    i10Index: computeI10Index(citationCounts),
    totalCitations,
    totalPublications,
    peerReviewedCount: counted.filter((w) => w.peerReviewed).length,
    firstAuthorCount: counted.filter(isFirstAuthor).length,
    meanCitations:
      totalPublications === 0 ? 0 : Math.round((totalCitations / totalPublications) * 100) / 100,
  };
}
