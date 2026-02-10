# Budgeting App Frontend

Frontend for the budgeting application backed by the Spring API in `../backend`.

## Stack

- React + Vite + TypeScript
- React Router
- TanStack Query
- React Hook Form + Zod
- Vitest + Testing Library
- Playwright

## Run (Docker full stack, recommended)

From repository root:

```bash
docker compose up --build -d
```

Then open [http://localhost:3000](http://localhost:3000).

In this mode, the browser uses `/api/v1` through frontend Nginx proxy.

## Run (Frontend only, Vite dev server)

From `frontend/`:

```bash
npm install
npm run dev
```

Set API URL in `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

If backend is run with Docker, make sure backend allows `http://localhost:5173` in CORS.

Template: `frontend/.env.example`

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
- Budget alignment insights with per-category drill-down trend + merchant analysis
- Unified transaction workspace with filters and inline edits
- Category management
- Monthly budget targets (server-backed) and budget-vs-actual comparison

## Notes

Budget targets are persisted server-side via `/api/v1/budgets` and are shared across browsers/devices for the same account.
