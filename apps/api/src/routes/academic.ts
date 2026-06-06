/**
 * Academic Domain API Routes
 *
 * The academic counterpart to the Hunter Protocol routes. Stateless and
 * computation-only (no persistence), these endpoints surface the academic
 * core engine — research-impact bibliometrics and scholar ⇄ position
 * compatibility scoring — plus the academic taxonomy and CV renderer.
 *
 * Endpoints:
 *   - GET  /academic/taxonomy           Enumerations + role families
 *   - POST /academic/research-impact     Works[] → author-level metrics
 *   - POST /academic/analyze-position    Position + profile → fit analysis
 *   - POST /academic/cv                  Profile → ordered CV sections
 */

import type { FastifyPluginCallback } from 'fastify';
import {
  AcademicPositionSchema,
  AcademicProfileSchema,
  CreditRoleSchema,
  InstitutionTypeSchema,
  PositionTypeSchema,
  PublicationStatusSchema,
  ScholarlyWorkSchema,
  ScholarlyWorkTypeSchema,
  z,
} from '@in-midst-my-life/schema';
import { computeResearchImpact, createAcademicAnalyzer } from '@in-midst-my-life/core';
import { ACADEMIC_ROLE_FAMILIES, buildAcademicCv } from '@in-midst-my-life/content-model';

const ResearchImpactRequestSchema = z.object({
  works: ScholarlyWorkSchema.array(),
});

const AnalyzePositionRequestSchema = z.object({
  position: AcademicPositionSchema,
  profile: AcademicProfileSchema,
  preferredLocations: z.string().array().optional(),
});

const CvRequestSchema = z.object({
  profile: AcademicProfileSchema,
});

const academicRoutes: FastifyPluginCallback = (server, _opts, done) => {
  const analyzer = createAcademicAnalyzer();

  /**
   * GET /academic/taxonomy
   * Returns the academic enumerations and role-family personas. Public.
   */
  server.get('/academic/taxonomy', async (_request, reply) => {
    return reply.send({
      creditRoles: CreditRoleSchema.options,
      publicationTypes: ScholarlyWorkTypeSchema.options,
      publicationStatuses: PublicationStatusSchema.options,
      positionTypes: PositionTypeSchema.options,
      institutionTypes: InstitutionTypeSchema.options,
      roleFamilies: ACADEMIC_ROLE_FAMILIES,
    });
  });

  /**
   * POST /academic/research-impact
   * Compute author-level bibliometrics (h-index, i10-index, ...) from works.
   */
  server.post('/academic/research-impact', async (request, reply) => {
    const parsed = ResearchImpactRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parsed.error.issues });
    }
    const metrics = computeResearchImpact(parsed.data.works);
    return reply.send(metrics);
  });

  /**
   * POST /academic/analyze-position
   * Score a scholar's ledger against an academic position.
   */
  server.post('/academic/analyze-position', async (request, reply) => {
    const parsed = AnalyzePositionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parsed.error.issues });
    }
    const { position, profile, preferredLocations } = parsed.data;
    const analysis = analyzer.analyze(
      preferredLocations ? { position, profile, preferredLocations } : { position, profile },
    );
    return reply.send(analysis);
  });

  /**
   * POST /academic/cv
   * Render an academic profile into conventionally-ordered CV sections.
   */
  server.post('/academic/cv', async (request, reply) => {
    const parsed = CvRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parsed.error.issues });
    }
    const cv = buildAcademicCv(parsed.data.profile);
    return reply.send(cv);
  });

  done();
};

export default academicRoutes;
