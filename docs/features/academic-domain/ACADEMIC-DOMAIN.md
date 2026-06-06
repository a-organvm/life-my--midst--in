# The Academic Domain

> Product manifestation #2. The Inverted Interview engine, first manifested for
> the **market** (the Hunter Protocol — matching a candidate to a *job*), now
> manifests for the **academy** — matching a scholar to an *academic position*
> on the research–teaching–service triangle.

This document does three things the seeding directive asked for: it **reviews
the internal precedent process** the academic domain mirrors, it **studies the
external instances** (real-world standards) the schema is anchored to, and it
**surfaces every surface** — internal (the code seams) and external (the
ecosystems we round-trip with) — through which the domain manifests.

---

## 1. Internal precedent: the market domain

The academic domain is a deliberate mirror of the market-facing **Hunter
Protocol**. Each layer has a one-to-one counterpart, so the precedent process is
re-used rather than reinvented:

| Concern | Market (precedent) | Academic (this domain) |
|---|---|---|
| Opportunity entity | `JobListing` | `AcademicPosition` |
| Candidate ledger | `Profile` (skills/experience) | `AcademicProfile` (works/grants/teaching/service) |
| "Benchmark" engine | `MarketRateAnalyzer` (salary percentiles) | `computeResearchImpact` (h-index / i10-index) |
| Fit engine | `DefaultCompatibilityAnalyzer` (skill/culture/comp/growth/location) | `AcademicCompatibilityAnalyzer` (research/teaching/funding/service/location) |
| Personas | role-families (job-title → mask blend) | `ACADEMIC_ROLE_FAMILIES` (position → mask blend) |
| Recommendation bands | `apply_now … skip` | `strong_apply … skip` |

The mirror is intentional: the same "review precedent → replicate the
layer pattern" process used to grow the market domain (`schema → core →
content-model → api → tests`) is what grew this one.

### Why personas are role-families, not new masks

The system has exactly 16 functional masks bound together by stage-affinity and
epoch-modifier matrices (`packages/content-model/src/taxonomy.ts`). Minting new
"Scholar" masks would destabilise those matrices. Instead — exactly as the
market domain maps *job titles* to mask blends — academic personas are expressed
as **role-families** over the existing masks (e.g. `research-scholar` =
analyst+synthesist+interpreter+narrator). This is the non-invasive extension
point the precedent already established.

---

## 2. External instances (studied & cited)

The schema is not invented; it is anchored to the standards the academy actually
uses, so an academic ledger can round-trip with the wider scholarly ecosystem.

- **ORCID record model** — the canonical machine-readable scholarly identity.
  Our `ScholarlyWork`, `Funding`, `ServiceRecord` and `AcademicPosition`
  entities mirror ORCID's *works*, *fundings*, *services* and *affiliations*
  activity sections (each carrying titles, organisations, dates and external
  identifiers).
  <https://info.orcid.org/documentation/integration-guide/orcid-record/>
- **CRediT — Contributor Roles Taxonomy (ANSI/NISO Z39.104-2022)** — the 14
  standard contributor roles. Encoded verbatim as `CreditRoleSchema` and carried
  on each `ScholarlyWork.contributorRoles`.
  <https://credit.niso.org/>
- **Author-level impact metrics (h-index, i10-index)** — `computeResearchImpact`
  implements the textbook definitions: h-index is the largest *h* such that *h*
  works are each cited ≥ *h* times; i10-index is the count of works with ≥ 10
  citations (a Google Scholar metric).
  <https://en.wikipedia.org/wiki/H-index>
- **Academic-CV conventions** — the section ordering produced by `buildAcademicCv`
  (research areas → publications by status/type → grants → teaching → service)
  follows the guidance published by university career-services offices, e.g.
  [UPenn Career Services](https://careerservices.upenn.edu/application-materials-for-the-faculty-job-search/cvs-for-faculty-job-applications/)
  and [MIT CAPD](https://capd.mit.edu/resources/cvs/).
- **The faculty job market** — the institution-type weighting (R1 research-heavy
  vs. primarily-undergraduate teaching-heavy, 2-2 vs. 4-4 loads) reflects how
  tenure criteria actually differ across institution types, per academic
  job-market guides such as [Lehigh Postdoctoral Affairs](https://postdoc.lehigh.edu/career-development/academic-job-search-practical-timeline-guide).

---

## 3. Surfaces (internal + external)

> "All surfaces require surfacing." Every point at which the academic domain is
> exposed.

### Internal surfaces (code seams)

| Layer | File | Surface |
|---|---|---|
| Schema | `packages/schema/src/academic.ts` | `ScholarlyWork`, `Funding`, `TeachingRecord`, `ServiceRecord`, `AcademicPosition`, `AcademicProfile`, `ResearchImpactMetrics`, `AcademicCompatibilityAnalysis`, `CreditRole`, `ScholarlyWorkType` |
| Core | `packages/core/src/academic/` | `computeHIndex`, `computeI10Index`, `computeResearchImpact`, `AcademicCompatibilityAnalyzer`, `createAcademicAnalyzer` |
| Content-model | `packages/content-model/src/academic.ts` | `ACADEMIC_ROLE_FAMILIES`, `matchAcademicRoleFamily`, `buildAcademicCv` |
| API | `apps/api/src/routes/academic.ts` | the HTTP surface (below) |

### API surface

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/academic/taxonomy` | CRediT roles, work types, position/institution types, role-family personas |
| `POST` | `/academic/research-impact` | `{ works[] }` → author-level bibliometrics |
| `POST` | `/academic/analyze-position` | `{ position, profile, preferredLocations? }` → compatibility analysis |
| `POST` | `/academic/cv` | `{ profile }` → ordered academic-CV sections |

### External surfaces (ecosystem round-trip)

The domain is shaped so the ledger can surface *outward* into the scholarly
graph: ORCID (works/fundings/services), CRediT (contributor attribution on
publications), and Scholar-style impact metrics. These are the external faces of
the same identity the market domain exposes through LinkedIn/JSON-LD.

---

## 4. The scoring model

`AcademicCompatibilityAnalyzer` is **position-driven**: the research / teaching /
service expectation triangle declared on the `AcademicPosition` (which encodes
institution type) is normalised into the bulk of the score, with funding and
location taking fixed slices. The consequence is that the *same scholar* scores
very differently across postings:

- A research-heavy scholar (high h-index, no teaching record) scores **strongly**
  against an R1 tenure-track line (`researchExpectation: 80`) …
- … and **weakly** against a teaching-focused PUI line (`teachingExpectation:
  70`), which also flips the suggested persona from `research-scholar` to
  `teaching-scholar`.

Funding is asymmetric by design: when a line *expects* external grant capture,
its absence is a flagged gap; when it does not, funding can only help.

---

## 5. Tests

| Suite | File |
|---|---|
| Schema validation | `packages/schema/test/academic.test.ts` |
| Bibliometrics | `packages/core/test/academic-research-impact.test.ts` |
| Compatibility scoring | `packages/core/test/academic-analyzer.test.ts` |
| API routes | `apps/api/test/academic.test.ts` |

---

## Sources

- ORCID Record Schema — <https://info.orcid.org/documentation/integration-guide/orcid-record/>
- CRediT — Contributor Roles Taxonomy (ANSI/NISO Z39.104-2022) — <https://credit.niso.org/>
- h-index — <https://en.wikipedia.org/wiki/H-index>
- i10-index — <https://guides.library.cornell.edu/impact/author-impact-10>
- CVs for Faculty Job Applications, UPenn Career Services — <https://careerservices.upenn.edu/application-materials-for-the-faculty-job-search/cvs-for-faculty-job-applications/>
- Curricula Vitae, MIT CAPD — <https://capd.mit.edu/resources/cvs/>
- Academic Job Search: A Practical Timeline & Guide, Lehigh — <https://postdoc.lehigh.edu/career-development/academic-job-search-practical-timeline-guide>
