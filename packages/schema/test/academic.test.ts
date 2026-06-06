import { describe, expect, it } from 'vitest';
import {
  AcademicPositionSchema,
  AcademicProfileSchema,
  CreditRoleSchema,
  FundingSchema,
  ScholarlyWorkSchema,
} from '../src/index';

describe('Academic domain schemas', () => {
  describe('CreditRoleSchema', () => {
    it('encodes the 14 CRediT contributor roles (ANSI/NISO Z39.104-2022)', () => {
      expect(CreditRoleSchema.options).toHaveLength(14);
      expect(CreditRoleSchema.safeParse('conceptualization').success).toBe(true);
      expect(CreditRoleSchema.safeParse('not-a-role').success).toBe(false);
    });
  });

  describe('ScholarlyWorkSchema', () => {
    it('applies defaults for citations, status and peer-review', () => {
      const parsed = ScholarlyWorkSchema.parse({
        id: '00000000-0000-0000-0000-000000000001',
        title: 'On Inverted Interviews',
        type: 'journal-article',
        year: 2024,
      });
      expect(parsed.citations).toBe(0);
      expect(parsed.status).toBe('published');
      expect(parsed.peerReviewed).toBe(true);
    });

    it('rejects an out-of-range year', () => {
      const result = ScholarlyWorkSchema.safeParse({
        id: '00000000-0000-0000-0000-000000000001',
        title: 'Time Travel',
        type: 'journal-article',
        year: 99999,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('FundingSchema', () => {
    it('validates an external PI grant', () => {
      const result = FundingSchema.safeParse({
        id: '00000000-0000-0000-0000-000000000002',
        title: 'CAREER Award',
        agency: 'NSF',
        role: 'principal-investigator',
        amount: 500000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('USD');
        expect(result.data.external).toBe(true);
      }
    });
  });

  describe('AcademicPositionSchema', () => {
    it('defaults the research/teaching/service expectation triangle', () => {
      const parsed = AcademicPositionSchema.parse({
        id: '00000000-0000-0000-0000-000000000003',
        title: 'Assistant Professor',
        institution: 'State University',
        institutionType: 'r1-research',
        positionType: 'tenure-track',
      });
      expect(parsed.researchExpectation).toBe(50);
      expect(parsed.teachingExpectation).toBe(30);
      expect(parsed.serviceExpectation).toBe(20);
      expect(parsed.subfields).toEqual([]);
    });
  });

  describe('AcademicProfileSchema', () => {
    it('accepts an empty ledger via defaults', () => {
      const parsed = AcademicProfileSchema.parse({});
      expect(parsed.works).toEqual([]);
      expect(parsed.fundings).toEqual([]);
      expect(parsed.teaching).toEqual([]);
      expect(parsed.service).toEqual([]);
    });
  });
});
