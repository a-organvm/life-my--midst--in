import { z } from 'zod';

/**
 * Academic Domain Schema
 *
 * The academic counterpart to the market-facing Hunter Protocol. Where the
 * Hunter Protocol matches a candidate to a *job* using compensation and skills,
 * the academic domain matches a scholar to an *academic position* using
 * research, teaching, funding, and service — the canonical "research–teaching–
 * service triangle" that governs faculty evaluation.
 *
 * The data model deliberately mirrors recognised external standards so an
 * academic ledger can round-trip with the wider scholarly ecosystem:
 *   - ORCID record model (works, fundings, peer-reviews, services, educations)
 *     https://info.orcid.org/documentation/integration-guide/orcid-record/
 *   - CRediT contributor roles taxonomy, ANSI/NISO Z39.104-2022
 *     https://credit.niso.org/
 *   - Author-level impact metrics (h-index, i10-index)
 *     https://en.wikipedia.org/wiki/H-index
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONTRIBUTOR ROLES — CRediT (ANSI/NISO Z39.104-2022), 14 canonical roles
// ─────────────────────────────────────────────────────────────────────────────

export const CreditRoleSchema = z.enum([
  'conceptualization',
  'data-curation',
  'formal-analysis',
  'funding-acquisition',
  'investigation',
  'methodology',
  'project-administration',
  'resources',
  'software',
  'supervision',
  'validation',
  'visualization',
  'writing-original-draft',
  'writing-review-editing',
]);

export type CreditRole = z.infer<typeof CreditRoleSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SCHOLARLY WORKS (ORCID "works" — publications, datasets, software, ...)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subset of ORCID work types most relevant to a CV publications section.
 * Named `ScholarlyWorkType` (not `PublicationType`) to avoid colliding with the
 * coarser `PublicationTypeSchema` already exported by the CV schema (cv.ts).
 */
export const ScholarlyWorkTypeSchema = z.enum([
  'journal-article',
  'conference-paper',
  'book',
  'book-chapter',
  'preprint',
  'thesis',
  'dataset',
  'software',
  'report',
  'other',
]);

export type ScholarlyWorkType = z.infer<typeof ScholarlyWorkTypeSchema>;

/**
 * Publication status — the lifecycle the most-scrutinised CV section is
 * sub-divided by (published / in press / under review / in preparation).
 */
export const PublicationStatusSchema = z.enum([
  'published',
  'in-press',
  'under-review',
  'in-preparation',
]);

export type PublicationStatus = z.infer<typeof PublicationStatusSchema>;

/** Author position is weighed heavily in evaluation (first / corresponding). */
export const AuthorPositionSchema = z.enum(['first', 'middle', 'last', 'corresponding', 'sole']);

export type AuthorPosition = z.infer<typeof AuthorPositionSchema>;

export const ScholarlyWorkSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  type: ScholarlyWorkTypeSchema,
  /** Journal or conference name (the publication venue). */
  venue: z.string().optional(),
  year: z.number().int().min(1500).max(2200),
  doi: z.string().optional(),
  url: z.string().url().optional(),
  /** Citation count — drives the h-index / i10-index metrics. */
  citations: z.number().int().min(0).default(0),
  status: PublicationStatusSchema.default('published'),
  peerReviewed: z.boolean().default(true),
  authorPosition: AuthorPositionSchema.optional(),
  coauthorCount: z.number().int().min(0).optional(),
  /** CRediT contribution roles for this work. */
  contributorRoles: CreditRoleSchema.array().optional(),
  tags: z.string().array().optional(),
});

export type ScholarlyWork = z.infer<typeof ScholarlyWorkSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// FUNDING / GRANTS (ORCID "fundings")
// ─────────────────────────────────────────────────────────────────────────────

/** Role on a grant — external grants where you are PI signal independence. */
export const FundingRoleSchema = z.enum([
  'principal-investigator',
  'co-principal-investigator',
  'co-investigator',
  'senior-personnel',
  'fellow',
  'consultant',
]);

export type FundingRole = z.infer<typeof FundingRoleSchema>;

export const FundingStatusSchema = z.enum([
  'proposed',
  'under-review',
  'awarded',
  'active',
  'completed',
  'declined',
]);

export type FundingStatus = z.infer<typeof FundingStatusSchema>;

export const FundingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  /** Granting agency (NSF, NIH, ERC, Wellcome Trust, ...). */
  agency: z.string().min(1),
  grantNumber: z.string().optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  role: FundingRoleSchema,
  status: FundingStatusSchema.default('awarded'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  /** Whether the funding source is external to the home institution. */
  external: z.boolean().default(true),
});

export type Funding = z.infer<typeof FundingSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// TEACHING RECORDS
// ─────────────────────────────────────────────────────────────────────────────

export const CourseLevelSchema = z.enum([
  'undergraduate',
  'graduate',
  'professional',
  'continuing-education',
]);

export type CourseLevel = z.infer<typeof CourseLevelSchema>;

export const CourseFormatSchema = z.enum([
  'lecture',
  'seminar',
  'laboratory',
  'studio',
  'online',
  'hybrid',
]);

export type CourseFormat = z.infer<typeof CourseFormatSchema>;

export const TeachingRecordSchema = z.object({
  id: z.string().uuid(),
  courseCode: z.string().optional(),
  title: z.string().min(1),
  institution: z.string().min(1),
  level: CourseLevelSchema,
  format: CourseFormatSchema.default('lecture'),
  term: z.string().optional(),
  enrollment: z.number().int().min(0).optional(),
  /** Normalised teaching evaluation score (0–5, e.g. mean course rating). */
  evaluationScore: z.number().min(0).max(5).optional(),
  roleAsInstructorOfRecord: z.boolean().default(true),
});

export type TeachingRecord = z.infer<typeof TeachingRecordSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE RECORDS (ORCID "services" / "memberships")
// ─────────────────────────────────────────────────────────────────────────────

/** The three broad categories of academic service. */
export const ServiceCategorySchema = z.enum(['institutional', 'disciplinary', 'community']);

export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;

export const ServiceRecordSchema = z.object({
  id: z.string().uuid(),
  category: ServiceCategorySchema,
  role: z.string().min(1),
  organization: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  /** e.g. journal peer-review counts, program-committee membership. */
  peerReviewCount: z.number().int().min(0).optional(),
});

export type ServiceRecord = z.infer<typeof ServiceRecordSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH IMPACT METRICS (author-level bibliometrics)
// ─────────────────────────────────────────────────────────────────────────────

export const ResearchImpactMetricsSchema = z.object({
  /** h-index: h papers each cited at least h times. */
  hIndex: z.number().int().min(0),
  /** i10-index: number of works with >= 10 citations (Google Scholar). */
  i10Index: z.number().int().min(0),
  totalCitations: z.number().int().min(0),
  totalPublications: z.number().int().min(0),
  peerReviewedCount: z.number().int().min(0),
  firstAuthorCount: z.number().int().min(0),
  /** Mean citations per published work. */
  meanCitations: z.number().min(0),
});

export type ResearchImpactMetrics = z.infer<typeof ResearchImpactMetricsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC POSITION (the "job" analogue — what a scholar is matched against)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Institution type strongly determines how research/teaching/service are
 * weighed (R1 → research-dominant; PUI / community college → teaching-dominant).
 */
export const InstitutionTypeSchema = z.enum([
  'r1-research',
  'r2-research',
  'liberal-arts',
  'primarily-undergraduate',
  'community-college',
  'research-institute',
  'industry-lab',
]);

export type InstitutionType = z.infer<typeof InstitutionTypeSchema>;

export const PositionTypeSchema = z.enum([
  'tenure-track',
  'tenured',
  'teaching-faculty',
  'research-faculty',
  'postdoctoral',
  'visiting',
  'adjunct',
  'lecturer',
]);

export type PositionType = z.infer<typeof PositionTypeSchema>;

export const AcademicPositionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  institution: z.string().min(1),
  department: z.string().optional(),
  institutionType: InstitutionTypeSchema,
  positionType: PositionTypeSchema,
  /** Teaching load notation, e.g. "2-2" (courses per term per year). */
  teachingLoad: z.string().optional(),
  /** Relative expectation weightings (0–100); used to tilt the fit scoring. */
  researchExpectation: z.number().min(0).max(100).default(50),
  teachingExpectation: z.number().min(0).max(100).default(30),
  serviceExpectation: z.number().min(0).max(100).default(20),
  /** Whether the role expects external grant capture. */
  fundingExpected: z.boolean().default(false),
  /** Research subfields the department is hiring into. */
  subfields: z.string().array().default([]),
  location: z.string().optional(),
  startDate: z.string().optional(),
  applicationDeadline: z.string().optional(),
});

export type AcademicPosition = z.infer<typeof AcademicPositionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC PROFILE (the scholar's ledger — the candidate side of the match)
// ─────────────────────────────────────────────────────────────────────────────

export const AcademicProfileSchema = z.object({
  profileId: z.string().uuid().optional(),
  /** Subfields the scholar works in — matched against position subfields. */
  researchAreas: z.string().array().default([]),
  works: ScholarlyWorkSchema.array().default([]),
  fundings: FundingSchema.array().default([]),
  teaching: TeachingRecordSchema.array().default([]),
  service: ServiceRecordSchema.array().default([]),
  /** Years since first appointment / PhD — proxy for career stage. */
  yearsActive: z.number().min(0).optional(),
});

export type AcademicProfile = z.infer<typeof AcademicProfileSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC COMPATIBILITY ANALYSIS (mirror of CompatibilityAnalysis)
// ─────────────────────────────────────────────────────────────────────────────

export const AcademicRecommendationSchema = z.enum([
  'strong_apply',
  'competitive',
  'reach',
  'developmental',
  'skip',
]);

export type AcademicRecommendation = z.infer<typeof AcademicRecommendationSchema>;

export const AcademicCompatibilityAnalysisSchema = z.object({
  position_id: z.string().uuid(),

  // Dimensional fit scores (0–100), mirroring the research–teaching–service triangle.
  research_fit: z.number().min(0).max(100),
  teaching_fit: z.number().min(0).max(100),
  funding_fit: z.number().min(0).max(100),
  service_fit: z.number().min(0).max(100),
  location_fit: z.number().min(0).max(100),

  overall_score: z.number().min(0).max(100),
  recommendation: AcademicRecommendationSchema,

  strengths: z.string().array(),
  gaps: z.string().array(),
  /** Things to foreground in a cover letter / job talk. */
  talking_points: z.string().array(),

  /** Recommended role-family persona to present this candidacy through. */
  suggested_role_family: z.string().optional(),

  metrics: ResearchImpactMetricsSchema,
  analysis_date: z.string(),
});

export type AcademicCompatibilityAnalysis = z.infer<typeof AcademicCompatibilityAnalysisSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN BUNDLE (mirrors HunterProtocolSchema)
// ─────────────────────────────────────────────────────────────────────────────

export const AcademicDomainSchema = z.object({
  profile: AcademicProfileSchema,
  positions: AcademicPositionSchema.array(),
  analyses: AcademicCompatibilityAnalysisSchema.array(),
});

export type AcademicDomain = z.infer<typeof AcademicDomainSchema>;
