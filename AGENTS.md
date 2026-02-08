# Frontend AGENTS.md

## Purpose
This file is the complete frontend operator map.
A new agent should be able to understand runtime behavior, API usage, cache invalidation, and change paths without additional discovery.

## Repo Identity
- Path: `/Users/petergelgor/Documents/projects/budgeting_app/frontend`
- Git repo: yes (independent from backend repo)
- App type: React + Vite + TypeScript SPA

## Quick Start
- Install: `npm install`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Unit/integration tests: `npm run test`
- E2E tests: `npm run e2e`
- Build: `npm run build`
- Frontend CI-style check chain: `npm run ci:check`
- JS duplicate guard: `npm run check:no-generated-js`

## Hard Invariants (Do Not Violate)
1. Canonical source is TypeScript-only.
   - No `.js` files under `src/**`.
   - No `.js` files under `tests/e2e/**`.
2. TypeScript must not emit JS into source paths.
   - `tsconfig.json` has `noEmit: true`.
3. Route definitions are canonical in one place.
   - Use `src/app/routes.ts`.
4. React Query keys are canonical in one place.
   - Use `src/shared/query/keys.ts`.
5. Month range helper is canonical in one place.
   - Use `src/shared/utils/date.ts` (`monthToDateRange`).
6. API calls are feature-scoped.
   - Import from `src/shared/api/endpoints/<feature>.ts`.
   - `src/shared/api/endpoints/index.ts` exists for compatibility but should not be default for new code.

## Runtime Environment
- API base URL source: `VITE_API_BASE_URL`.
- Default fallback in code: `http://localhost:8080/api/v1` in `src/shared/api/client.ts`.
- Frontend-only mode:
  - `.env` should point `VITE_API_BASE_URL` to backend host, typically `http://localhost:8080/api/v1`.
- Docker full-stack mode:
  - `VITE_API_BASE_URL=/api/v1` and browser calls go through frontend Nginx proxy.

## Boot Sequence (Exact)
1. `src/main.tsx` loads styles and calls `bootstrapApp()`.
2. `src/app/bootstrap.ts` registers unauthorized handler on `apiClient`.
3. React mounts `AppProviders` then `App`.
4. `src/app/providers.tsx` runs `restoreSession()` once on mount.
5. `restoreSession()` attempts refresh token exchange and then `/auth/me`.
6. Router (`src/app/router.tsx`) renders route tree; protected routes gate via `RequireAuth`.

## Auth Model And State Machine

### State source
- Single external store: `src/shared/auth/sessionStore.ts`.
- States: `loading`, `authenticated`, `anonymous`.

### Tokens
- Access token: in-memory only.
- Refresh token: localStorage key `budget.refresh_token`.

### Request behavior
- `src/shared/api/httpClient.ts` attaches `Authorization: Bearer <accessToken>` for auth requests.
- On `401` with auth enabled, it calls unauthorized handler once.
- Unauthorized handler is `refreshAccessToken()` from `authApi.ts`.
- If refresh succeeds, original request retries once.
- If refresh fails, session is cleared and state becomes `anonymous`.

## Routing (Canonical)
- Route constants + nav metadata: `src/app/routes.ts`.

### Public routes
- `/login` -> `LoginPage`
- `/register` -> `RegisterPage`

### Protected routes
- `/dashboard` -> `DashboardPage`
- `/connections` -> `ConnectionsPage`
- `/transactions` -> `TransactionsPage`
- `/categories` -> `CategoriesPage`
- `/budgets` -> `BudgetsPage`
- `/recurring` -> `RecurringPage`
- `/accounts/:id` -> `AccountDetailPage` (detail view, not in nav)

### Guards
- `RequireAuth` redirects non-authenticated users to `/login`.
- Unknown paths redirect to `/dashboard`.

## Architecture Map
- App shell and routing:
  - `src/main.tsx`
  - `src/app/App.tsx`
  - `src/app/routes.ts`
  - `src/app/router.tsx`
  - `src/app/layout/AppShell.tsx`
  - `src/app/layout/RequireAuth.tsx`
- Providers/bootstrap:
  - `src/app/providers.tsx`
  - `src/app/bootstrap.ts`
- Domain contracts:
  - `src/domain/types.ts`
  - `src/domain/schemas.ts`
  - `src/domain/format.ts`
  - `src/domain/transactions.ts`
- API layer:
  - `src/shared/api/httpClient.ts`
  - `src/shared/api/client.ts`
  - `src/shared/api/endpoints/accounts.ts`
  - `src/shared/api/endpoints/connections.ts`
  - `src/shared/api/endpoints/transactions.ts`
  - `src/shared/api/endpoints/categories.ts`
  - `src/shared/api/endpoints/analytics.ts`
  - `src/shared/api/endpoints/budgets.ts`
  - `src/shared/api/endpoints/recurring.ts`
- Auth/session:
  - `src/shared/auth/authApi.ts`
  - `src/shared/auth/sessionStore.ts`
  - `src/shared/hooks/useAuth.ts`
- Query/cache:
  - `src/shared/query/queryClient.ts`
  - `src/shared/query/keys.ts`
- Feature pages:
  - `src/features/auth/AuthPages.tsx`
  - `src/features/dashboard/DashboardPage.tsx`
  - `src/features/connections/ConnectionsPage.tsx`
  - `src/features/transactions/TransactionsPage.tsx`
  - `src/features/categories/CategoriesPage.tsx`
  - `src/features/budgets/BudgetsPage.tsx`
  - `src/features/recurring/RecurringPage.tsx`
  - `src/features/accounts/AccountDetailPage.tsx`
- Shared UI and styling:
  - `src/shared/ui/*`
  - `src/app/styles.css`

## Query Key Canonical Families
- `queryKeys.accounts.all()` -> `['accounts']`
- `queryKeys.accounts.detail(id)` -> `['accounts', id]`
- `queryKeys.accounts.summary()` -> `['accounts', 'summary']`
- `queryKeys.connections.all()` -> `['connections']`
- `queryKeys.transactions.all()` -> `['transactions']`
- `queryKeys.transactions.list(filters)` -> `['transactions', filters]`
- `queryKeys.transactions.coverage()` -> `['transactions', 'coverage']`
- `queryKeys.transactions.transfers()` -> `['transactions', 'transfers']`
- `queryKeys.transactions.uncategorized(startDate, endDate)`
- `queryKeys.categories.all()` -> `['categories']`
- `queryKeys.categories.tree()` -> `['categories', 'tree']`
- `queryKeys.categories.flat()` -> `['categories', 'flat']`
- `queryKeys.categories.rules()` -> `['categories', 'rules']`
- `queryKeys.analytics.all()` -> `['analytics']`
- `queryKeys.analytics.spending(startDate, endDate)`
- `queryKeys.analytics.cashFlow(startDate, endDate)`
- `queryKeys.analytics.trends(months)`
- `queryKeys.budgets.all()` -> `['budgets']`
- `queryKeys.budgets.month(month)` -> `['budgets', month]`
- `queryKeys.recurring.all()` -> `['recurring']`
- `queryKeys.recurring.upcoming()` -> `['recurring', 'upcoming']`
- `queryKeys.recurring.calendar(month)` -> `['recurring', 'calendar', month]`

## Feature Ownership And API/Cache Behavior

### Auth (`src/features/auth/AuthPages.tsx`)
- Login uses `authApi.login`.
- Register uses `authApi.register`.
- On success, navigates to `/dashboard`.

### Dashboard (`src/features/dashboard/DashboardPage.tsx`)
- Reads:
  - accounts summary
  - cashflow by current month range
  - spending by current month range
  - flat categories
- Net worth card behavior:
  - shows three account sections: `Bank Accounts`, `Investments`, `Liabilities`
  - groups rows by institution within each section
  - section placement is driven by account `netWorthCategory` from backend
- Query keys:
  - `accounts.summary`
  - `analytics.cashFlow(startDate,endDate)`
  - `analytics.spending(startDate,endDate)`
  - `categories.flat`
  - `budgets.month(month)`
- Budget summary combines backend spending with persisted monthly budget targets from `/budgets`.

### Connections (`src/features/connections/ConnectionsPage.tsx`)
- Reads:
  - connections list
  - account summary
- Mutations:
  - setup connection
  - sync connection
  - delete connection
- Invalidation on setup:
  - `connections.all`, `accounts.all`
- Invalidation on sync/delete:
  - `connections.all`, `transactions.all`, `analytics.all`, `accounts.all`

### Transactions (`src/features/transactions/TransactionsPage.tsx`)
- Reads:
  - accounts list
  - flat categories
  - transaction list by filters
    - includes `descriptionQuery` search (case-insensitive, ignores punctuation/special characters)
  - transaction coverage summary
  - transfer pairs
- Mutations:
  - update transaction (category/notes/excludeFromTotals)
  - create categorization rule from selected transaction defaults
    - defaults now prefill 3 chained conditions: description + account + amount
    - user can add/remove filters and choose `AND`/`OR`
  - mark transfer pair
  - unlink transfer pair
- Unified Transactions row UX:
  - each transaction renders as a two-line grouped row:
    - top line: `Date`, `Description`, `Amount`
    - bottom line: `Account`, `Category`, `Notes`
  - parent row shows ID on the left and a centered 3-dot actions menu on the right
  - row-level actions are in that menu (`Notes`, `Exclude from totals`, `Add Rule`, `Mark Transfer`)
  - notes are edited in the menu and autosave (no explicit Save button)
  - desktop/vertical-monitor widths keep the two 3-field grouped lines
  - mid-range widths (`561px` to `760px`) switch to stacked field areas (`date/amount`, then description, account, category, notes)
  - mobile layout collapses grouped lines to single-column fields without page-level horizontal scrolling
- Transfer Pairs card UX:
  - each transfer pair renders as the same two-line grouped row pattern with left-side IDs and right-side action area
  - top line: `Date`, `Description`, `Amount`
  - bottom line: `From Account`, `To Account`, `Type`
  - mid-range widths (`561px` to `760px`) use stacked field areas (`date/amount`, description, from account, to account, type)
  - small-screen behavior matches Unified Transactions (single-column grouped fields on mobile)
- Filters card UX:
  - filter inputs use a responsive grid (desktop 6 columns, medium 3 columns, tablet 2 columns, mobile 1 column)
  - transfer toggle spans full row on medium/tablet/mobile to avoid label/input compression
- Invalidation on update:
  - `transactions.all`, `analytics.all`

### Categories (`src/features/categories/CategoriesPage.tsx`)
- Reads:
  - category tree
  - flat categories
  - categorization rules
  - tracked transactions for selected categorization rule (`/categorization-rules/{id}/transactions`)
- UX behavior:
  - clicking a category name opens an inline modal-like details panel directly under that category row in the tree (no separate bottom-of-page explorer section)
  - rule editor supports chained filters with `AND`/`OR` across description/payee/memo/account/amount
- Mutations:
  - create category
  - update category
  - delete category
  - create categorization rule
  - update categorization rule
  - delete categorization rule
- Invalidation:
  - `categories.all`
  - `categories.rules`

### Budgets (`src/features/budgets/BudgetsPage.tsx`)
- Reads:
  - month budgets (`/budgets?month=YYYY-MM`)
  - flat categories
  - spending by month
  - filtered transactions for uncategorized warning
- Writes:
  - upsert monthly targets (`PUT /budgets/{month}`)
  - delete category target (`DELETE /budgets/{month}/categories/{categoryId}`)

### Recurring (`src/features/recurring/RecurringPage.tsx`)
- Reads:
  - recurring patterns
  - upcoming bills
- Mutations:
  - detect recurring patterns
  - toggle pattern active/inactive
  - delete pattern
- Invalidation:
  - `recurring.all`, `recurring.upcoming`

### Account Detail (`src/features/accounts/AccountDetailPage.tsx`)
- Reads:
  - account detail by id
  - transactions filtered by account id
- Mutations:
  - update account net worth category (`PATCH /accounts/{id}/net-worth-category`)
- Invalidation/update behavior on save:
  - updates `accounts.detail(id)` cache directly
  - invalidates `accounts.summary` and `accounts.all`
- Navigated to from Dashboard net worth breakdown account links

## API Layer Contract Rules
1. Every endpoint function should validate payload with Zod schema when response JSON has shape constraints.
2. Endpoint files should remain feature-scoped.
3. Domain schemas are single source of runtime validation truth (`src/domain/schemas.ts`).
4. Domain types remain TS compile-time contracts (`src/domain/types.ts`).

## Testing Map
- Unit/integration tests: `src/**/*.test.ts`, `src/**/*.test.tsx`.
- E2E tests: `tests/e2e/*.spec.ts`.
- Current E2E files:
  - `tests/e2e/core-flow.spec.ts`
  - `tests/e2e/signup-regression.spec.ts`
- `playwright.config.ts` starts Vite dev server at `127.0.0.1:5173` for E2E.

### Mandatory MCP Validation For UI Changes
- For any new or changed frontend feature, run a Playwright MCP manual smoke flow on the actual UI and include explicit pass/fail status in the delivery message.
- If the feature depends on backend/API/auth/database behavior, run MCP against Docker full stack (`docker compose up --build -d` from workspace root) instead of frontend-only dev mode.
- If authentication is required and no credentials are already present in the conversation, request username/password from the user before running MCP.
- Keep automated tests (`typecheck`, unit/integration, build) in addition to MCP; MCP does not replace them.

## JS Duplicate Prevention Policy
- Guard script: `scripts/check-no-generated-js.mjs`.
- It fails if these exist:
  - any `src/**/*.js`
  - any `tests/e2e/**/*.js`
  - root config mirrors: `vite.config.js`, `vitest.config.js`, `playwright.config.js`
- Keep this command in pre-merge validation:
  - `npm run check:no-generated-js`

## Common Debug Paths
- Auth/session issues:
  1. `src/shared/auth/sessionStore.ts`
  2. `src/shared/auth/authApi.ts`
  3. `src/app/bootstrap.ts`
  4. `src/app/layout/RequireAuth.tsx`
- API request/retry issues:
  1. `src/shared/api/httpClient.ts`
  2. `src/shared/api/client.ts`
  3. relevant endpoint module under `src/shared/api/endpoints/`
- Stale/incorrect UI data:
  1. query key factory usage in page
  2. mutation `invalidateQueries` calls
  3. key definitions in `src/shared/query/keys.ts`
- Budget math/storage issues:
  1. `src/features/budgets/budgetStore.ts`
  2. `src/features/budgets/BudgetsPage.tsx`
  3. `src/features/dashboard/DashboardPage.tsx`

## Change Playbooks

### Add or modify backend response fields in frontend
1. Update relevant schema in `src/domain/schemas.ts`.
2. Update TS type usage if needed in `src/domain/types.ts`.
3. Update endpoint module in `src/shared/api/endpoints/<feature>.ts`.
4. Update page/component consumers.
5. Add or update tests.

### Add a new page with backend data
1. Add route constants in `src/app/routes.ts`.
2. Add route entry in `src/app/router.tsx`.
3. If navigable, add to `navigationRoutes` in `src/app/routes.ts`.
4. Add endpoint functions in feature-scoped endpoint module.
5. Add query keys in `src/shared/query/keys.ts`.
6. Use `useQuery`/`useMutation` with canonical keys.

### Add a mutation
1. Define request/response shape in endpoint module.
2. Use `useMutation` in feature page/component.
3. Invalidate exact canonical key families impacted by mutation.
4. Verify downstream pages depending on invalidated keys refresh as expected.

## Known Functional Gaps
- No user-facing categorization-rule management page (rules are managed inline from Transactions and Categories pages).

## Notes Protocol (Required)
When the user supplies a correction that resolves a real issue:
1. Record short evergreen guidance in `Learned Fixes` section here.
2. Record detailed debugging context in `notes_to_agent/<YYYY-MM-DD>-<slug>.md`.
3. Update `notes_to_agent/index.md` in the same change.
4. Keep notes index sorted newest-first.

Use `notes_to_agent/_note_template.md` for note structure.

## Learned Fixes
- For wide tables inside grid/card layouts, set `min-width: 0` on container grid items and use an internal `overflow-x: auto` wrapper so horizontal overflow stays inside the component instead of expanding the entire page.
- For dense transactional datasets on mobile, prefer grouped two-line rows with labeled fields over multi-column tables; keep primary metadata and actions at parent level (ID left, actions right) and collapse field grids at small breakpoints.
