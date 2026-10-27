# Stage 7 Admin review module

2026-10-22. Tasks 42–47 implemented; cross-repository Tasks 1–53 are complete
within local acceptance scope. Public/Confidential A–D both passed with exit 0
and cleanup. See the [backend handoff](../../../viora-BE/docs/handoffs/developer-platform-stage-7.md)
and [acceptance record](../../../viora-BE/docs/handoffs/developer-platform-stage-7-acceptance.md).

- Routes: `/mini-app-reviews`, `/mini-app-reviews/:id`, `/mini-apps`, `/mini-apps/:id`.
  One navigation module retains existing authenticated Axios/refresh behavior.
- Queue/overview: bounded search/status/order/pagination, immutable-version logo,
  Developer identity, historical/approved reviews and published/suspended apps.
  App views filter server-side before count/pagination.
- Detail: frozen metadata/legal/domain/SSO snapshot, sealed evidence, decisions,
  timeline and operational/publication reasons. HTTPS links/images reject URL
  credentials; escaped reasons remain text. No client secret is displayed.
- Server capabilities determine start/assign/approve/change/reject/suspend/restore.
  Native modal confirmation captures original revisions/request ID, requires
  reasons/change items and guards double submission. Ambiguous retries reuse the
  exact payload; conflicts require refreshed state. Restore stays unpublished.
- Native dialog focus/cancel behavior, mutation announcement/focus, responsive
  layouts at 320/375/768/1440, readable tables and safe overflow are verified in
  the isolated browser workflows documented in the backend acceptance record.

Validation: 18 native Node tests; TypeScript/Vite production build and full ESLint
pass. Existing >500 kB bundle advisory remains; no dependency changes. Commands:

```powershell
node --test src/services/admin-mini-app.service.test.mjs src/components/MiniAppReview/review-queue.test.mjs src/components/MiniAppReview/review-detail.test.mjs src/components/MiniAppReview/review-actions.test.mjs src/components/MiniAppReview/moderation.test.mjs
npm run build
npm run lint
```

Logs: `.codex-tmp/stage7-admin-final-{tests,build,lint}.log`. Real browser/API/SSO
fixtures live in `../viora-BE/tools/MiniAppReviewE2E`, with scoped TLS, disposable
PostgreSQL, actual Admin password/live-session auth and fresh browser profiles.
Do not point that fixture at deployed APIs or copy its keys/data into deployment.
Final real-host logs: `../viora-BE/.codex-tmp/stage7-resume-e2e-{public,confidential}.log`.
The Confidential run also verifies competing Admin dialogs: a stale start returns
409, cannot overwrite the new state and restores focus to a live heading.
Admin bundles were freshly built by each isolated runner; existing regression
tests/build/lint remain the unchanged 2026-10-21 application baseline.
Feature flag remains off by default. No deployment, commit or Stage 8 work.
