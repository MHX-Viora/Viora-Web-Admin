# Admin UI refactor

## Objective

Standardize the existing Admin interface as a responsive premium SaaS dashboard
without changing APIs, routing, permissions, state management, public component
names, or business behavior.

## Scope

- Shared shell: 260px collapsible sidebar, 72px topbar, responsive navigation.
- Design system: blue semantic palette, 18px cards, restrained shadows, 200–300ms
  interaction transitions, accessible focus states.
- Shared UI: typography, buttons, inputs, search clear action, filters, tables,
  badges, pagination, modal, drawer, loading, empty and detail cards.
- Dashboard: clearer date context and explicit data refresh action using the
  existing query.

## Verification

- `npm run lint`
- `npm run build`
- Static responsive rules cover desktop, laptop, tablet and mobile breakpoints.

## Boundaries preserved

No service, API contract, router, permission, database, state-management or
business-rule changes.
