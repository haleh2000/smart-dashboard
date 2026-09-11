# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SMART is a support dashboard for Dey Insurance (بیمه دی). **`README.md` (Persian) is the product spec and the source of business logic.** Read the relevant section before building a feature. Reference screenshots of the current CRM and Power BI report are in `images/`.

Stack: React 19 + TypeScript (strict) + Vite, plain CSS on design tokens (no CSS framework), React Router, TanStack Query (server state), Zustand (shared client state), Vitest + Testing Library. The UI is Persian and **RTL** (`<html dir="rtl" lang="fa">`).

## Commands

```bash
npm run dev            # dev server
npm run build          # type-check + production build
npm run typecheck      # tsc -b
npm run lint           # ESLint, including the architecture boundary rules
npm run format         # Prettier
npm test               # all tests once
npm run test:watch
npx vitest run src/modules/dashboard/domain/filters.test.ts   # one file
npx vitest run -t "toggles a value"                           # one test by name
```

Before finishing any change, run `npm run typecheck && npm run lint && npm test`.

TypeScript is pinned to `~6.0`: `typescript-eslint` doesn't support TS 7 yet.

## Architecture: Clean Architecture, sliced by feature

```
src/
  app/        composition root: DI container, providers, router, Daydar shell (layout/), navigation
  modules/    one folder per feature (auth, tickets, dashboard, …)
    <name>/
      domain/          entities, business rules, repository ports (interfaces). Plain TS only.
      infrastructure/  adapters that implement the ports (Mock* today, Http* once api.yml exists)
      presentation/    React: pages, components, query hooks, labels, paths, stores
      index.ts         the module's public API
  shared/     feature-agnostic kernel: ui/, theme/, http/, di/, domain/ (pagination), lib/, config/
  styles/     global design-system CSS: tokens, base, forms, view-transitions
  mocks/      fake backend dataset used by Mock* adapters (to be deleted once the API exists)
  test/       test setup + renderWithProviders
```

### Dependency rule (enforced by `eslint.config.js`, so `npm run lint` fails on violations)

- `domain/` imports nothing from React, the router, TanStack Query, Zustand, `shared/ui`, `shared/http`, infrastructure, presentation, `mocks` or `app`.
- `presentation/` never imports `infrastructure/`. It gets adapters through the port hook (e.g. `useTicketRepository()`).
- `shared/` never imports `modules/`, `app/` or `mocks/`.
- Nothing outside `app/` imports `app/`.
- Other modules are imported **only through their public API** (`@/modules/tickets`), never with deep paths. Inside a module, use relative imports.

### How dependency injection works

1. A module defines its port in `domain/` (e.g. `TicketRepository`).
2. `presentation/<x>Services.ts` creates a typed Provider/hook pair with `createServiceContext` (`src/shared/di`).
3. `src/app/container.ts` is the **only** place that chooses concrete adapters. `src/app/AppProviders.tsx` provides them.
4. Tests inject fakes through the same Provider (see `TicketListPage.test.tsx` + `src/test/renderWithProviders.tsx`).

There is no separate use-case/application layer on purpose (YAGNI). Presentation query hooks call the port directly. Add `modules/<name>/application/` only when a flow has real orchestration logic, e.g. it combines several repositories or enforces rules that belong to neither the domain nor the UI.

### Where things go

- **Business rules** (pure functions) go in `domain/` with a unit test next to them. Examples: `hasPermission` (RBAC matrix), `toggleFilter` / `subjectDrillLevel` / `filtersForChart` (dashboard cross-filtering).
- **Persian labels and badge colors** are presentation concerns (`ticketLabels.ts`, `roleLabels.ts`, `dimensionLabels.ts`), not domain.
- **Server data** goes through TanStack Query hooks in `presentation/hooks/*Queries.ts`, each with a query-key factory (`ticketKeys`, `analyticsKeys`).
- **Shared client state** goes in Zustand only when several components need it (`dashboardFilterStore`). URL-worthy state goes in search params (`useTicketListParams`: filters, sort and page survive reload and back-navigation).
- **Route paths** a module owns live in the module (`ticketPaths`). The app router mounts them.
- **Sidebar, route guards and default landing page:** `src/app/navigation.ts` + `src/app/router.tsx`. Each route is wrapped in `guarded(permission, …)`, and the sidebar hides items the role can't access.

## Domain rules from the spec

- **SMART never creates tickets.** They come from CRM. `images/create-ticket.png` is only a data-model reference.
- **CRM is the source of truth.** SMART data (sentiment, priority, AI tags, voiceId, transcript) sits in `Ticket.enrichment`, attached to the same `TicketID`, and must never overwrite CRM fields. Table columns are CRM columns (in CRM order) plus enrichment columns. They're defined as a config array in `TicketTable.tsx`, so add a column there.
- **Ticket status badges** use cleaned-up labels with the CRM color mapping (`statusMeta`).
- **RBAC:** the `rolePermissions` matrix in `modules/auth/domain/permission.ts` is the only place access rules live. Agents don't see the dashboard; `admin.manage` is Admin only.
- **Dashboard cross-filtering** (Power BI parity): clicking any chart segment filters every chart and KPI, clicking it again removes the filter, and active filters show as chips. The Subject1→2→3 panel drills down, and changing a parent level clears deeper levels. Each chart queries with every filter except its own dimension, so it keeps showing all its segments and highlights the selected one.
- **Auth:** `/login` is a two-step form (mobile → password) outside `SessionGate`; the gate sends anonymous visitors there and back. Until the real API exists, `MockAuthRepository` accepts any valid mobile (`09xxxxxxxxx`, Persian digits allowed) with any non-empty password.
- **Aggregation belongs to the backend.** `AnalyticsRepository` returns breakdowns and KPIs; the mock computes them in memory.

## When `api.yml` arrives (repo root)

1. Generate or write DTO types from it. `openapi-typescript` is a good fit once it supports TS 6; otherwise use `npx openapi-typescript@latest` or write the types by hand.
2. For each port, add `modules/<name>/infrastructure/Http<Name>Repository.ts` using `createHttpClient({ baseUrl: env.apiBaseUrl, getToken })` from `@/shared/http`, plus a mapper from DTO to domain entity (e.g. ISO string → `Date`). Keep DTOs inside infrastructure.
3. Swap the adapters in `src/app/container.ts`. Presentation and domain code should not change. If they have to, the port was wrong, so fix the port.
4. Check the domain field names in `modules/tickets/domain/ticket.ts` and the status list against the API. Then delete `src/mocks/`, the `Mock*` adapters, `devSession.ts` and `DevRoleSwitcher`.

Config: `VITE_API_BASE_URL` (see `.env.example`). Read env vars only through `src/shared/config/env.ts`.

## Design system (ported from the Day «خدمات غیر حضوری درمان» frontend)

The look is copied from the sibling Day Insurance project (`~/GolandProjects/qeireHozoriKhadamat-Day/frontend`); when in doubt about a visual detail, match that project.

- **Tokens are the single source of truth:** `src/styles/tokens.css` holds every color, gradient, radius, shadow, spacing and motion value, with light and dark themes under the same names. **Never write a hex literal or a raw px spacing value in a component.** Use `var(--…)`. Chart colors come only from `--chart-series-1..5`.
- **Styling approach:** each component imports a co-located plain `.css` file with BEM class names (`.queue-table__row`, `.side-nav__item--active`). Shared control classes live in `src/styles/forms.css` (`.btn` / `.btn--primary|accent|ghost|danger`, `.form-input`, `.form-select`, `.form-field`). Extend these instead of re-declaring button or input height, padding or radius. A button next to an input matches its height through `--control-height`.
- **Controls** use `--radius-control` (10px), never pill-shaped. `--radius-pill` is only for badges, chips, dots and round icon buttons.
- **Shell** (`src/app/layout/AppShell.*`): desktop (≥1025px) is a teal field with the navigation rail on the right (profile card, menu, floating دی‌دی) and the page inside a rounded floating panel with a glass header (دی‌دار lockup + title, dev role switcher, theme toggle, logout). At ≤1024px the rail is hidden and navigation moves to a glass bottom bar.
- **Theme:** `src/shared/theme/colorTheme.ts` cycles system → light → dark, persists the choice and applies `data-theme` on `<html>` with a 45° view-transition wipe. `initializeColorTheme()` runs in `main.tsx` before the first render.
- **Persian digits everywhere:** render every user-facing number (ids, mobiles, national codes, counts) through `formatPersianNumber`. Dates go through `formatDateTime` («۱۴۰۵/۰۴/۱۱ ۱۰:۳۰», Jalali via `Intl`, no date library). Normalize typed input with `toLatinDigits` before validating or querying.
- **Designed states:** `SkeletonTable` for loading (no spinners), `ErrorState` (calm, with retry), `EmptyState` (dashed; `mascot` shows دی‌دی), `MascotLoader` for the session bootstrap.
- **Charts** are `BarList` rankings (bar width relative to the largest row, count + share shown inline), not a chart library. RTL labels stay readable and rows are clickable for cross-filtering.
- **Assets:** Vazirmatn woff2 in `public/fonts` (no font CDN) and the دی‌دار logo and دی‌دی mascot in `public/brand`.

## Conventions

- No TypeScript `enum`s (`erasableSyntaxOnly`). Use `as const` arrays plus a derived union (`TICKET_STATUSES` / `TicketStatus`).
- `noUncheckedIndexedAccess` is on, so handle `undefined` from index access.
- Reuse the shared UI primitives in `@/shared/ui` (`Button`, `StatusBadge`, `PageHeader`, `Panel`, `StatCard`, `BarList`, `Pagination`, `SkeletonTable`, `ErrorState`, `EmptyState`, `ThemeToggle`, `NavIcon`). Promote a component into `shared/ui` only when a second module needs it.
- `StatusBadge` tones are `info | warning | error | success | neutral`, mapped from domain values in each module's labels file (e.g. `statusMeta`).
- Navigation is flat (`src/app/navigation.ts`). Add an icon to `NavIcon` when adding a section.
- Sidebar sections that aren't built yet (Calls, Customers, Management) render `ComingSoonPage`. Build each one as a new module following the tickets module's structure.
