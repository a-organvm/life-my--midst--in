import { describe, it, expect } from 'vitest';
import { AcademicCompatibilityAnalyzer } from '../src/academic/academic-analyzer';
import type { AcademicPosition, AcademicProfile, ScholarlyWork } from '@in-midst-my-life/schema';

const uuid = (n: number): string => `00000000-0000-0000-0000-${n.toString().padStart(12, '0')}`;

const pub = (i: number, citations: number): ScholarlyWork => ({
  id: uuid(i),
  title: `Paper ${i}`,
  type: 'journal-article',
  year: 2018 + (i % 5),
  citations,
  status: 'published',
  peerReviewed: true,
  authorPosition: 'first',
});

/** A research-heavy scholar: many well-cited, first-author papers (h-index 10). */
const researchScholar: AcademicProfile = {
  researchAreas: ['machine learning', 'nlp'],
  works: [
    pub(1, 40),
    pub(2, 35),
    pub(3, 30),
    pub(4, 28),
    pub(5, 25),
    pub(6, 22),
    pub(7, 20),
    pub(8, 15),
    pub(9, 12),
    pub(10, 11),
  ],
  fundings: [
    {
      id: uuid(100),
      title: 'CAREER: Foundations',
      agency: 'NSF',
      amount: 600_000,
      currency: 'USD',
      role: 'principal-investigator',
      status: 'active',
      external: true,
    },
  ],
  teaching: [],
  service: [
    {
      id: uuid(200),
      category: 'disciplinary',
      role: 'Program Committee',
      organization: 'ACL',
      peerReviewCount: 12,
    },
  ],
};

const r1Position: AcademicPosition = {
  id: uuid(1),
  title: 'Assistant Professor',
  institution: 'State R1',
  institutionType: 'r1-research',
  positionType: 'tenure-track',
  researchExpectation: 80,
  teachingExpectation: 15,
  serviceExpectation: 5,
  fundingExpected: true,
  subfields: ['machine learning'],
};

const puiPosition: AcademicPosition = {
  id: uuid(2),
  title: 'Assistant Professor of Teaching',
  institution: 'Liberal Arts College',
  institutionType: 'primarily-undergraduate',
  positionType: 'teaching-faculty',
  researchExpectation: 20,
  teachingExpectation: 70,
  serviceExpectation: 10,
  fundingExpected: false,
  subfields: ['machine learning'],
};

describe('AcademicCompatibilityAnalyzer', () => {
  const analyzer = new AcademicCompatibilityAnalyzer();

  it('scores a research scholar highly against a research-weighted R1 line', () => {
    const result = analyzer.analyze({ position: r1Position, profile: researchScholar });
    expect(result.research_fit).toBeGreaterThanOrEqual(70);
    expect(result.overall_score).toBeGreaterThanOrEqual(65);
    expect(['strong_apply', 'competitive']).toContain(result.recommendation);
    expect(result.suggested_role_family).toBe('research-scholar');
  });

  it('applies position-driven weighting (same scholar scores lower at a teaching-weighted PUI)', () => {
    const r1 = analyzer.analyze({ position: r1Position, profile: researchScholar });
    const pui = analyzer.analyze({ position: puiPosition, profile: researchScholar });
    // Research-heavy scholar with no teaching record fares worse where teaching dominates.
    expect(pui.overall_score).toBeLessThan(r1.overall_score);
    expect(pui.suggested_role_family).toBe('teaching-scholar');
  });

  it('flags missing external funding when a line expects grant capture', () => {
    const unfunded: AcademicProfile = { ...researchScholar, fundings: [] };
    const result = analyzer.analyze({ position: r1Position, profile: unfunded });
    expect(result.funding_fit).toBe(20);
    expect(result.gaps.join(' ')).toMatch(/funding/i);
  });

  it('does not penalise absent funding when it is not expected', () => {
    const unfunded: AcademicProfile = { ...researchScholar, fundings: [] };
    const result = analyzer.analyze({ position: puiPosition, profile: unfunded });
    expect(result.funding_fit).toBeGreaterThanOrEqual(70);
  });

  it('rewards exact subfield alignment via a talking point', () => {
    const result = analyzer.analyze({ position: r1Position, profile: researchScholar });
    expect(result.talking_points.join(' ')).toMatch(/machine learning/i);
  });

  it('uses location preferences for the location dimension', () => {
    const positioned: AcademicPosition = { ...r1Position, location: 'Boston, MA' };
    const match = analyzer.analyze({
      position: positioned,
      profile: researchScholar,
      preferredLocations: ['Boston'],
    });
    const miss = analyzer.analyze({
      position: positioned,
      profile: researchScholar,
      preferredLocations: ['Honolulu'],
    });
    expect(match.location_fit).toBeGreaterThan(miss.location_fit);
  });

  it('embeds computed research metrics in the analysis', () => {
    const result = analyzer.analyze({ position: r1Position, profile: researchScholar });
    expect(result.metrics.totalPublications).toBe(10);
    expect(result.metrics.hIndex).toBe(10);
  });
});
