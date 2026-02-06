# Budgeting App Frontend

Frontend for the budgeting application backed by the Spring API in `../backend/budget`.

## Stack

- React + Vite + TypeScript
- React Router
- TanStack Query
- React Hook Form + Zod
- Vitest + Testing Library
- Playwright

## Run

```bash
npm install
npm run dev
```

Set API URL in `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Structure

- `src/app`: app shell, router, providers
- `src/domain`: core types, schemas, formatters
- `src/features`: feature modules
- `src/shared`: api/auth/query/ui shared utilities
- `docs`: architecture and backend handoff docs

## Feature Coverage (V1)

- Auth (register/login/restore/logout)
- Connection setup and sync
- Dashboard analytics snapshot
- Unified transaction workspace with filters and inline edits
- Category management
- Monthly budget targets (local adapter) and budget-vs-actual comparison

## Notes

Budget targets are persisted locally in V1 by `LocalBudgetStoreAdapter`. Planned API contract for server-backed budgets is documented in `docs/backend-budget-contract.md`.
