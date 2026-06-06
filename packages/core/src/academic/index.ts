/**
 * Academic Domain — Core
 *
 * Pure, framework-free business logic for the academic counterpart to the
 * Hunter Protocol:
 *   - research-impact: author-level bibliometrics (h-index, i10-index)
 *   - academic-analyzer: scholar ⇄ academic-position compatibility scoring
 */

export { computeHIndex, computeI10Index, computeResearchImpact } from './research-impact';

export {
  AcademicCompatibilityAnalyzer,
  createAcademicAnalyzer,
  type AcademicAnalysisInput,
} from './academic-analyzer';
