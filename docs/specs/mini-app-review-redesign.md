# Mini App review presentation

Match the existing ANKT Admin: shared typography, teal accent, theme tokens,
buttons and accessible status colors. Preserve API, permissions, review actions,
URL filters and pagination. No dependency, deployment or automatic commit.

Implement in order: (1) page navigation and overview metrics, (2) filter toolbar,
review table/loading/empty states, (3) scoped responsive CSS. Reuse Lucide and
shared PageHeader. Keep shared detail/dialog styles compatible.

Acceptance: all seven real overview metrics remain actionable; search/status/
sort/page-size/assignee filters and paging retain their handlers; user content is
escaped; dark/light themes work; no horizontal page overflow on mobile, table
may scroll within its container. Do not invent production counts.

Verify: `node --test src/components/MiniAppReview/*.test.mjs
src/services/admin-mini-app.service.test.mjs`, `npx tsc -b`, targeted ESLint,
`npx vite build`; real Chrome with isolated mocked API data in light/dark modes
and narrow/wide viewports. Record exact verification in a handoff.
