# Mini App review redesign — 2026-10-27

- Matches existing ANKT Admin tokens, PageHeader, Lucide, shared buttons and
  light/dark themes. No API, permissions, service or dependency changes.
- Overview has seven real metrics, status-filter selection and publication links.
- Review queue uses a semantic table, colored status badges, identity/version,
  developer, assignment, timestamp and exact review links. Local table scrolling
  contains overflow on narrow viewports.
- Search/status/sort/page-size/assignee handlers and URL filters remain intact.
  Added clear-filter controls and designed loading/empty/error states.
- Scoped shared MiniAppReview styles also improve tabs and status badges on the
  related app/detail views. Existing detail/dialog tests remain passing.

Validation: 20 review/service tests passed; `tsc -b`, changed-file ESLint and Vite
production build passed. Vite retains the existing >500 kB chunk warning.
Chrome fixture renders the real AdminLayout/page with isolated sample query data:
light/dark, populated/empty/loading/error, metric filtering, search and clear
filters verified. 320px, 390px and 1440px checks showed no page horizontal overflow;
no browser warnings/errors. No production API access or deployment.

Temporary fixture and build outputs: `.codex-tmp/review-redesign/`; exclude from
commits. Source, specification and tests are included in the redesign commit.
