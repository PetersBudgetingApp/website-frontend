# AGENTS.md

## Purpose
Use this file as the first stop before searching the codebase. It captures project map, workflows, and how to persist new learnings.

## Quick Start
- Install: `npm install`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Unit/integration tests: `npm run test`
- E2E tests: `npm run e2e`
- Build: `npm run build`

## Environment
- API base URL comes from `VITE_API_BASE_URL` in `.env`.
- For frontend-only Vite dev, use `http://localhost:8080/api/v1`.
- For Docker full-stack, use `/api/v1` (handled through frontend Nginx proxy).
- Default fallback in code remains `http://localhost:8080/api/v1` (`src/shared/api/client.ts`).

## Architecture Map
- App shell and routing:
  - `src/main.tsx`
  - `src/app/App.tsx`
  - `src/app/router.tsx`
  - `src/app/layout/AppShell.tsx`
  - `src/app/layout/RequireAuth.tsx`
- App bootstrap/providers:
  - `src/app/bootstrap.ts` sets global unauthorized-refresh handler.
  - `src/app/providers.tsx` restores session once on startup.
- Domain contracts:
  - `src/domain/types.ts` shared TS types.
  - `src/domain/schemas.ts` Zod runtime schemas for API payloads.
  - `src/domain/format.ts`, `src/domain/transactions.ts` domain helpers.
- API and auth:
  - `src/shared/api/httpClient.ts` generic request + auth retry logic.
  - `src/shared/api/endpoints.ts` all typed backend calls.
  - `src/shared/auth/authApi.ts` login/register/logout/refresh/restore flows.
  - `src/shared/auth/sessionStore.ts` in-memory access token + localStorage refresh token.
  - `src/shared/hooks/useAuth.ts` app auth state subscription.
- Feature pages:
  - `src/features/dashboard/DashboardPage.tsx`
  - `src/features/connections/ConnectionsPage.tsx`
  - `src/features/transactions/TransactionsPage.tsx`
  - `src/features/categories/CategoriesPage.tsx`
  - `src/features/budgets/BudgetsPage.tsx`
- Shared UI:
  - `src/shared/ui/*`
  - Styling in `src/app/styles.css`

## Route Map
- Public:
  - `/login`
  - `/register`
- Auth-only:
  - `/dashboard`
  - `/connections`
  - `/transactions`
  - `/categories`
  - `/budgets`

## Data + State Notes
- React Query config: `src/shared/query/queryClient.ts`.
- Query key families used heavily:
  - `['accounts']`, `['accounts', 'summary']`
  - `['connections']`
  - `['transactions', ...]`
  - `['categories', 'flat'|'tree']`
  - `['analytics', ...]`
- Budget targets are local-only in V1:
  - Storage adapter: `src/features/budgets/budgetStore.ts`
  - Backend migration contract: `docs/backend-budget-contract.md`

## Common Change Paths
- Add/modify backend field:
  1. Update Zod schema in `src/domain/schemas.ts`.
  2. Update matching types if needed in `src/domain/types.ts`.
  3. Wire endpoint in `src/shared/api/endpoints.ts`.
  4. Update UI consumers in relevant feature page/components.
  5. Add/adjust tests.
- Auth/session bug:
  1. Check `sessionStore.ts` state transitions.
  2. Check `authApi.ts` refresh/restore sequence.
  3. Check `bootstrap.ts` unauthorized handler hookup.
  4. Check `RequireAuth.tsx` redirect behavior.
- Budget behavior issue:
  1. Check `budgetStore.ts` local persistence + performance math.
  2. Check `BudgetsPage.tsx` target map save/filter logic.
  3. Check `DashboardPage.tsx` budget summary aggregation.

## Testing Map
- Unit/integration tests live in `src/**/*.test.ts(x)`.
- E2E tests live in `tests/e2e/*.spec.ts`.
- Important existing E2E coverage:
  - auth screen render/navigation (`tests/e2e/core-flow.spec.ts`)
  - signup regression guard to dashboard (`tests/e2e/signup-regression.spec.ts`)

## Notes Protocol (Required)
When you get stuck and the user provides the correct fix/explanation:

1. Decide where to record:
   - Put short evergreen guidance in this file under `Learned Fixes`.
   - Put non-trivial debugging/fix details in `notes_to_agent/<YYYY-MM-DD>-<slug>.md`.
2. If creating/updating a note in `notes_to_agent/`, always update `notes_to_agent/index.md` in the same change.
3. In the index, include:
   - Date
   - Title
   - Area
   - Tags
   - File path
4. Keep index sorted newest-first by date.
5. In note files, include:
   - Symptom
   - Root cause
   - Correct fix
   - Verification
   - References (files touched)

Use `notes_to_agent/_note_template.md` as the default format for new notes.

## Learned Fixes
- None yet.
