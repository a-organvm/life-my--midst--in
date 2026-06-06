import { beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from './app-builder';

const uuid = (n: number): string => `00000000-0000-0000-0000-${n.toString().padStart(12, '0')}`;

describe('academic routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  it('exposes the academic taxonomy', async () => {
    const res = await app.inject({ method: 'GET', url: '/academic/taxonomy' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.creditRoles).toHaveLength(14);
    expect(body.institutionTypes).toContain('r1-research');
    const familyIds = body.roleFamilies.map((f: any) => f.id);
    expect(familyIds).toContain('research-scholar');
  });

  it('computes research impact metrics from works', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/academic/research-impact',
      payload: {
        works: [
          { id: uuid(1), title: 'P1', type: 'journal-article', year: 2020, citations: 12 },
          { id: uuid(2), title: 'P2', type: 'journal-article', year: 2021, citations: 11 },
          { id: uuid(3), title: 'P3', type: 'conference-paper', year: 2022, citations: 3 },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totalPublications).toBe(3);
    expect(body.hIndex).toBe(3);
    expect(body.i10Index).toBe(2);
  });

  it('rejects malformed research-impact requests', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/academic/research-impact',
      payload: { works: [{ title: 'missing id and type' }] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('analyzes a scholar against an academic position', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/academic/analyze-position',
      payload: {
        position: {
          id: uuid(10),
          title: 'Assistant Professor',
          institution: 'State R1',
          institutionType: 'r1-research',
          positionType: 'tenure-track',
          researchExpectation: 80,
          teachingExpectation: 15,
          serviceExpectation: 5,
          fundingExpected: true,
          subfields: ['machine learning'],
        },
        profile: {
          researchAreas: ['machine learning'],
          works: [
            {
              id: uuid(1),
              title: 'P1',
              type: 'journal-article',
              year: 2020,
              citations: 30,
              authorPosition: 'first',
            },
            {
              id: uuid(2),
              title: 'P2',
              type: 'journal-article',
              year: 2021,
              citations: 25,
              authorPosition: 'first',
            },
            { id: uuid(3), title: 'P3', type: 'journal-article', year: 2022, citations: 20 },
          ],
          fundings: [
            {
              id: uuid(100),
              title: 'NSF Grant',
              agency: 'NSF',
              role: 'principal-investigator',
              amount: 600000,
              status: 'active',
            },
          ],
        },
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.position_id).toBe(uuid(10));
    expect(body.overall_score).toBeGreaterThanOrEqual(0);
    expect(body.overall_score).toBeLessThanOrEqual(100);
    expect(['strong_apply', 'competitive', 'reach', 'developmental', 'skip']).toContain(
      body.recommendation,
    );
    expect(body.metrics.totalPublications).toBe(3);
  });

  it('renders an academic CV in conventional section order', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/academic/cv',
      payload: {
        profile: {
          researchAreas: ['nlp'],
          works: [
            {
              id: uuid(1),
              title: 'Published Paper',
              type: 'journal-article',
              year: 2023,
              citations: 5,
              status: 'published',
            },
            {
              id: uuid(2),
              title: 'Submitted Paper',
              type: 'journal-article',
              year: 2024,
              status: 'under-review',
            },
          ],
          teaching: [
            { id: uuid(3), title: 'Intro to NLP', institution: 'State U', level: 'graduate' },
          ],
        },
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const sectionIds = body.sections.map((s: any) => s.id);
    expect(sectionIds).toContain('research-areas');
    expect(sectionIds).toContain('publications-published');
    expect(sectionIds).toContain('publications-under-review');
    expect(sectionIds).toContain('teaching');
    // Research areas precede publications precede teaching.
    expect(sectionIds.indexOf('research-areas')).toBeLessThan(
      sectionIds.indexOf('publications-published'),
    );
    expect(sectionIds.indexOf('publications-published')).toBeLessThan(
      sectionIds.indexOf('teaching'),
    );
  });
});
