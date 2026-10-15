# Developer console upgrade

## Implemented
- Actual public Developer auth/documentation routes and protected portal routes in App.tsx.
- Responsive sidebar and eight app tabs: overview, connection, domains, ANKT SSO,
  app members, releases, analytics, settings. Existing audit/permissions routes retained.
- Profile context survives nested app routing; app DTO membershipRole controls app editing.
- Approved profile shows change request; existing accepted terms reused, current version
  re-fetched immediately before submission. Policies open public detail documents.
- App list searches name/slug/ID, filters status, sorts name/update, pages 12 local items;
  uses existing list API without inventing backend paging.
- Copy controls below IDs/URLs; credential metadata never fetches plaintext secret.
  New secret stays in React state, supports one-time disclosure and copy.
  Rotation/revoke use account-provider reauthentication and bounded grace selection.
- Domain random filename/content/URL are server-provided; legacy fixed filename supported.
  Expiry, check failure, verification, renewal and root-file download are wired to APIs.
- Organization selection sends X-Developer-Organization. App invitations bind Account ID;
  inbox acceptance, invite/cancel/member update/removal use existing additive endpoints.
  Scoped invited users can open accessible apps without first creating a Developer profile.
- Logo/cover upload uses authenticated existing /api/articles/media, validates image/15 MB,
  preserves previous image on failure, blocks save while uploading.
- Admin review uses public client identifiers, distinct review/publication state and server
  domain verification URL; no admin plaintext secret access.

## Validation
- TypeScript build, Vite production build and ESLint.
- Existing regression tests plus focused console tests: exact domain filename/content,
  Google/provider reauth + app proof + grace, Viewer gates, approved change-request display.
- Real Chrome headless running Vite/React with isolated profile and fully intercepted
  localhost API fixture. Verified eight tabs, exact Client ID copy, no password for copy or
  domain; desktop 1262 and narrow effective 504 viewport with no app content overflow.
  This was UI runtime validation, not live backend or provider verification.
- Reusable fixture: tests/developer-console-browser-fixture.js. Synthetic token is invalid
  against ANKT servers; fixture only operates localhost:4187.

## Boundaries
- Firebase project configuration/provider delivery and SMTP are environment-owned.
- Pending schema migration must deploy with BE before additive portal APIs are available.
- No commit, deployment, migration application or external email sent by this UI work.
- Real metrics are shown from existing analytics API; unimplemented login-specific metrics
  and owner-transfer/delete actions are not fabricated.
