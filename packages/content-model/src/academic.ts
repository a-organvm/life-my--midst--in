/**
 * Academic Domain — Content Model
 *
 * Two non-invasive extensions for the academic domain:
 *
 *   1. ACADEMIC_ROLE_FAMILIES — academic "personas" expressed as blends of the
 *      existing 16 functional masks (the same mechanism role-families.ts uses
 *      for industry job titles). This avoids minting new mask types, which
 *      would destabilise the mask/stage/epoch affinity matrices.
 *
 *   2. buildAcademicCv — renders an AcademicProfile into the canonical
 *      academic-CV section order (research areas → publications grouped by
 *      status/type → grants → teaching → service), following the conventions
 *      published by university career-services offices.
 */

import type {
  AcademicProfile,
  Funding,
  PublicationStatus,
  ScholarlyWork,
  ServiceRecord,
  TeachingRecord,
} from '@in-midst-my-life/schema';
import type { RoleFamily } from './role-families';

// ─────────────────────────────────────────────────────────────────────────────
// ROLE FAMILIES (academic personas as mask blends)
// ─────────────────────────────────────────────────────────────────────────────

export const ACADEMIC_ROLE_FAMILIES: RoleFamily[] = [
  {
    id: 'research-scholar',
    name: 'Research Scholar',
    aliases: [
      'research professor',
      'research scientist',
      'research fellow',
      'postdoctoral researcher',
      'postdoctoral fellow',
      'principal investigator',
      'tenure-track professor',
      'assistant professor',
      'associate professor',
    ],
    maskBlend: [
      { maskId: 'analyst', weight: 0.35 },
      { maskId: 'synthesist', weight: 0.25 },
      { maskId: 'interpreter', weight: 0.2 },
      { maskId: 'narrator', weight: 0.2 },
    ],
    emphasisTags: ['research', 'analysis', 'publication', 'methodology'],
    deEmphasisTags: ['operations', 'delivery'],
  },
  {
    id: 'teaching-scholar',
    name: 'Teaching Scholar',
    aliases: [
      'teaching professor',
      'lecturer',
      'senior lecturer',
      'instructor',
      'teaching faculty',
      'professor of practice',
      'clinical professor',
    ],
    maskBlend: [
      { maskId: 'narrator', weight: 0.3 },
      { maskId: 'mediator', weight: 0.3 },
      { maskId: 'interpreter', weight: 0.2 },
      { maskId: 'steward', weight: 0.2 },
    ],
    emphasisTags: ['pedagogy', 'communication', 'mentorship', 'curriculum'],
    deEmphasisTags: ['speculation'],
  },
  {
    id: 'scholar-educator',
    name: 'Scholar-Educator',
    aliases: [
      'professor',
      'faculty',
      'department chair',
      'liberal arts professor',
      'comprehensive university professor',
    ],
    maskBlend: [
      { maskId: 'synthesist', weight: 0.25 },
      { maskId: 'narrator', weight: 0.25 },
      { maskId: 'mediator', weight: 0.25 },
      { maskId: 'analyst', weight: 0.25 },
    ],
    emphasisTags: ['research', 'pedagogy', 'synthesis', 'service'],
    deEmphasisTags: [],
  },
  {
    id: 'principal-investigator',
    name: 'Principal Investigator',
    aliases: [
      'lab director',
      'center director',
      'research group leader',
      'grant principal investigator',
      'program director',
    ],
    maskBlend: [
      { maskId: 'strategist', weight: 0.3 },
      { maskId: 'steward', weight: 0.25 },
      { maskId: 'architect', weight: 0.25 },
      { maskId: 'narrator', weight: 0.2 },
    ],
    emphasisTags: ['funding', 'leadership', 'vision', 'supervision'],
    deEmphasisTags: ['tactical'],
  },
];

/**
 * Match an academic position title to a role family. Mirrors matchRoleFamily
 * but over the academic catalogue. Returns undefined when nothing matches so
 * callers can fall back to keyword scoring.
 */
export function matchAcademicRoleFamily(positionTitle: string): RoleFamily | undefined {
  const normalized = positionTitle.trim().toLowerCase();
  if (normalized.length < 2) return undefined;

  for (const family of ACADEMIC_ROLE_FAMILIES) {
    for (const alias of family.aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        return family;
      }
    }
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC CV RENDERING
// ─────────────────────────────────────────────────────────────────────────────

export interface AcademicCvEntry {
  id: string;
  /** Primary line — e.g. a publication title or course title. */
  primary: string;
  /** Secondary detail — venue, institution, agency. */
  secondary?: string;
  /** Trailing metadata — year, citations, amount. */
  meta?: string;
}

export interface AcademicCvSection {
  id: string;
  title: string;
  entries: AcademicCvEntry[];
}

export interface AcademicCv {
  sections: AcademicCvSection[];
}

/** Human-readable ordering for the publication-status subsections. */
const PUBLICATION_STATUS_ORDER: PublicationStatus[] = [
  'published',
  'in-press',
  'under-review',
  'in-preparation',
];

const STATUS_LABELS: Record<PublicationStatus, string> = {
  published: 'Published',
  'in-press': 'In Press',
  'under-review': 'Under Review',
  'in-preparation': 'In Preparation',
};

function workEntry(work: ScholarlyWork): AcademicCvEntry {
  const metaParts = [String(work.year)];
  if (work.status === 'published' || work.status === 'in-press') {
    metaParts.push(`${work.citations} citations`);
  } else {
    metaParts.push(STATUS_LABELS[work.status]);
  }
  return {
    id: work.id,
    primary: work.title,
    secondary: work.venue,
    meta: metaParts.join(' · '),
  };
}

function publicationSections(works: ScholarlyWork[]): AcademicCvSection[] {
  const sections: AcademicCvSection[] = [];
  for (const status of PUBLICATION_STATUS_ORDER) {
    const inStatus = works.filter((w) => w.status === status).sort((a, b) => b.year - a.year);
    if (inStatus.length === 0) continue;
    sections.push({
      id: `publications-${status}`,
      title: `Publications — ${STATUS_LABELS[status]}`,
      entries: inStatus.map(workEntry),
    });
  }
  return sections;
}

function fundingEntry(grant: Funding): AcademicCvEntry {
  const metaParts: string[] = [];
  if (typeof grant.amount === 'number') {
    metaParts.push(`${grant.currency} ${grant.amount.toLocaleString()}`);
  }
  metaParts.push(grant.role);
  metaParts.push(grant.status);
  return {
    id: grant.id,
    primary: grant.title,
    secondary: grant.grantNumber ? `${grant.agency} (${grant.grantNumber})` : grant.agency,
    meta: metaParts.join(' · '),
  };
}

function teachingEntry(record: TeachingRecord): AcademicCvEntry {
  const metaParts: string[] = [record.level, record.format];
  if (typeof record.enrollment === 'number') metaParts.push(`${record.enrollment} enrolled`);
  if (typeof record.evaluationScore === 'number') {
    metaParts.push(`eval ${record.evaluationScore.toFixed(1)}/5`);
  }
  return {
    id: record.id,
    primary: record.courseCode ? `${record.courseCode}: ${record.title}` : record.title,
    secondary: record.term ? `${record.institution} · ${record.term}` : record.institution,
    meta: metaParts.join(' · '),
  };
}

function serviceEntry(record: ServiceRecord): AcademicCvEntry {
  const metaParts: string[] = [record.category];
  if (typeof record.peerReviewCount === 'number') {
    metaParts.push(`${record.peerReviewCount} reviews`);
  }
  return {
    id: record.id,
    primary: record.role,
    secondary: record.organization,
    meta: metaParts.join(' · '),
  };
}

/**
 * Render an AcademicProfile into ordered CV sections following the conventional
 * academic-CV ordering. Empty sections are omitted.
 */
export function buildAcademicCv(profile: AcademicProfile): AcademicCv {
  const sections: AcademicCvSection[] = [];

  if (profile.researchAreas.length > 0) {
    sections.push({
      id: 'research-areas',
      title: 'Research Areas',
      entries: profile.researchAreas.map((area, i) => ({
        id: `research-area-${i}`,
        primary: area,
      })),
    });
  }

  sections.push(...publicationSections(profile.works));

  if (profile.fundings.length > 0) {
    sections.push({
      id: 'grants-funding',
      title: 'Grants & Funding',
      entries: profile.fundings.map(fundingEntry),
    });
  }

  if (profile.teaching.length > 0) {
    sections.push({
      id: 'teaching',
      title: 'Teaching',
      entries: profile.teaching.map(teachingEntry),
    });
  }

  if (profile.service.length > 0) {
    sections.push({
      id: 'service',
      title: 'Service',
      entries: profile.service.map(serviceEntry),
    });
  }

  return { sections };
}
