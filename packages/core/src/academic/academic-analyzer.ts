/**
 * Academic Compatibility Analyzer
 *
 * The academic mirror of the Hunter Protocol's DefaultCompatibilityAnalyzer.
 * Instead of scoring a candidate against a job on skill/culture/compensation,
 * it scores a scholar against an academic position on the canonical
 * research–teaching–service triangle, plus funding and location.
 *
 * Crucially, the weighting is *position-driven*: an R1 tenure-track line that
 * declares research_expectation=80 will weigh publications heavily, while a
 * primarily-undergraduate institution that declares teaching_expectation=70
 * will reward a strong teaching record instead — the same posting can yield
 * very different overall scores for the same scholar.
 */

import type {
  AcademicCompatibilityAnalysis,
  AcademicPosition,
  AcademicProfile,
  AcademicRecommendation,
  Funding,
  ResearchImpactMetrics,
} from '@in-midst-my-life/schema';
import { computeResearchImpact } from './research-impact';

export interface AcademicAnalysisInput {
  position: AcademicPosition;
  profile: AcademicProfile;
  /** Optional location preferences for the location_fit dimension. */
  preferredLocations?: string[];
}

const clamp = (n: number): number => Math.round(Math.min(100, Math.max(0, n)));

const normalize = (s: string): string => s.trim().toLowerCase();

/** Map a 0–100 overall score to a recommendation band. */
function recommend(score: number): AcademicRecommendation {
  if (score >= 80) return 'strong_apply';
  if (score >= 65) return 'competitive';
  if (score >= 50) return 'reach';
  if (score >= 35) return 'developmental';
  return 'skip';
}

function externalPiGrants(fundings: Funding[]): Funding[] {
  return fundings.filter(
    (f) =>
      f.external &&
      (f.role === 'principal-investigator' || f.role === 'co-principal-investigator') &&
      (f.status === 'awarded' || f.status === 'active' || f.status === 'completed'),
  );
}

function subfieldOverlapScore(position: AcademicPosition, profile: AcademicProfile): number {
  if (position.subfields.length === 0) return 60; // neutral when the line is open
  const areas = new Set(profile.researchAreas.map(normalize));
  const matched = position.subfields.filter((s) => areas.has(normalize(s))).length;
  return clamp((matched / position.subfields.length) * 100);
}

function researchFit(
  position: AcademicPosition,
  profile: AcademicProfile,
  metrics: ResearchImpactMetrics,
): number {
  const hComponent = Math.min(100, metrics.hIndex * 6);
  const pubComponent = Math.min(100, metrics.totalPublications * 8);
  const subfieldComponent = subfieldOverlapScore(position, profile);
  return clamp(0.4 * hComponent + 0.25 * pubComponent + 0.35 * subfieldComponent);
}

function teachingFit(profile: AcademicProfile): number {
  const records = profile.teaching;
  const countComponent = Math.min(100, records.length * 15);

  const scored = records.filter((r) => typeof r.evaluationScore === 'number');
  const evalComponent =
    scored.length === 0
      ? 60 // neutral when no evaluations are on record
      : clamp(
          (scored.reduce((sum, r) => sum + (r.evaluationScore ?? 0), 0) / scored.length / 5) * 100,
        );

  const distinctLevels = new Set(records.map((r) => r.level)).size;
  const breadthComponent = Math.min(100, (distinctLevels / 4) * 100);

  return clamp(0.4 * countComponent + 0.4 * evalComponent + 0.2 * breadthComponent);
}

function fundingFit(position: AcademicPosition, profile: AcademicProfile): number {
  const piGrants = externalPiGrants(profile.fundings);
  const totalAwarded = piGrants.reduce((sum, g) => sum + (g.amount ?? 0), 0);

  if (position.fundingExpected) {
    if (piGrants.length === 0) return 20; // a grant-expecting line with no external PI funding
    const piComponent = Math.min(100, piGrants.length * 40);
    const amountComponent = Math.min(100, (totalAwarded / 500_000) * 100);
    return clamp(0.6 * piComponent + 0.4 * amountComponent);
  }

  // Funding not expected: presence is a bonus, absence is not penalised.
  return clamp(70 + Math.min(30, profile.fundings.length * 10));
}

function serviceFit(profile: AcademicProfile): number {
  const records = profile.service;
  const distinctCategories = new Set(records.map((r) => r.category)).size;
  const categoryComponent = Math.min(100, (distinctCategories / 3) * 100);

  const peerReviews = records.reduce((sum, r) => sum + (r.peerReviewCount ?? 0), 0);
  const peerReviewComponent = Math.min(100, peerReviews * 5);

  const countComponent = Math.min(100, records.length * 20);

  return clamp(0.4 * categoryComponent + 0.3 * peerReviewComponent + 0.3 * countComponent);
}

function locationFit(position: AcademicPosition, preferred?: string[]): number {
  if (!preferred || preferred.length === 0) return 70; // neutral
  if (!position.location) return 60;
  const loc = normalize(position.location);
  const matched = preferred.some((p) => loc.includes(normalize(p)) || normalize(p).includes(loc));
  return matched ? 100 : 40;
}

/**
 * Pick a presentation persona (role-family id, see content-model
 * ACADEMIC_ROLE_FAMILIES) based on what the position emphasises.
 */
function suggestRoleFamily(position: AcademicPosition): string {
  const { researchExpectation: r, teachingExpectation: t } = position;
  if (r >= t + 15) return 'research-scholar';
  if (t >= r + 15) return 'teaching-scholar';
  return 'scholar-educator';
}

/**
 * Analyzes the compatibility between a scholar's academic ledger and an
 * academic position. Stateless and deterministic — no external providers — so
 * it is trivially testable and safe to call inside a request handler.
 */
export class AcademicCompatibilityAnalyzer {
  analyze(input: AcademicAnalysisInput): AcademicCompatibilityAnalysis {
    const { position, profile, preferredLocations } = input;
    const metrics = computeResearchImpact(profile.works);

    const research_fit = researchFit(position, profile, metrics);
    const teaching_fit = teachingFit(profile);
    const funding_fit = fundingFit(position, profile);
    const service_fit = serviceFit(profile);
    const location_fit = locationFit(position, preferredLocations);

    // Position-driven weighting. The research/teaching/service expectations
    // (which encode institution type) are normalised into the bulk of the
    // score; funding and location take fixed slices.
    const fundingWeight = position.fundingExpected ? 0.15 : 0.05;
    const locationWeight = 0.1;
    const triangleWeight = 1 - fundingWeight - locationWeight;

    const expSum =
      position.researchExpectation + position.teachingExpectation + position.serviceExpectation;
    // Guard against a degenerate all-zero expectation set.
    const safeSum = expSum > 0 ? expSum : 1;
    const wR = position.researchExpectation / safeSum;
    const wT = position.teachingExpectation / safeSum;
    const wS = position.serviceExpectation / safeSum;

    const triangleScore = wR * research_fit + wT * teaching_fit + wS * service_fit;
    const overall_score = clamp(
      triangleWeight * triangleScore + fundingWeight * funding_fit + locationWeight * location_fit,
    );

    const strengths: string[] = [];
    const gaps: string[] = [];
    const talking_points: string[] = [];

    if (research_fit >= 70) {
      strengths.push(
        `Strong research record (h-index ${metrics.hIndex}, ${metrics.totalPublications} publications, ${metrics.totalCitations} citations).`,
      );
    } else if (position.researchExpectation >= 50) {
      gaps.push(
        `Research profile may be light for a research-weighted line (h-index ${metrics.hIndex}).`,
      );
    }

    if (teaching_fit >= 70) {
      strengths.push(`Demonstrated teaching breadth across ${profile.teaching.length} courses.`);
    } else if (position.teachingExpectation >= 40) {
      gaps.push(
        'Teaching record is thin for a teaching-weighted role; foreground any TA / guest lectures.',
      );
    }

    if (position.fundingExpected && funding_fit < 40) {
      gaps.push(
        'No external PI funding on record; address grant strategy in the research statement.',
      );
    } else if (funding_fit >= 70) {
      strengths.push('Track record of external grant capture signals research independence.');
    }

    if (metrics.firstAuthorCount > 0) {
      talking_points.push(
        `${metrics.firstAuthorCount} first/sole/corresponding-author works to anchor the research narrative.`,
      );
    }
    const subfieldMatches = position.subfields.filter((s) =>
      new Set(profile.researchAreas.map(normalize)).has(normalize(s)),
    );
    if (subfieldMatches.length > 0) {
      talking_points.push(`Direct subfield alignment: ${subfieldMatches.join(', ')}.`);
    }
    talking_points.push(
      `Frame the application for a ${position.institutionType} ${position.positionType} context.`,
    );

    return {
      position_id: position.id,
      research_fit,
      teaching_fit,
      funding_fit,
      service_fit,
      location_fit,
      overall_score,
      recommendation: recommend(overall_score),
      strengths,
      gaps,
      talking_points,
      suggested_role_family: suggestRoleFamily(position),
      metrics,
      analysis_date: new Date().toISOString(),
    };
  }
}

/** Factory mirroring createHunterProtocolAgent. */
export function createAcademicAnalyzer(): AcademicCompatibilityAnalyzer {
  return new AcademicCompatibilityAnalyzer();
}
