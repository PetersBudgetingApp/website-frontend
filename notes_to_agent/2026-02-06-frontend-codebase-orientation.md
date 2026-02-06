# Frontend Codebase Orientation

- Date: 2026-02-06
- Area: architecture
- Tags: bootstrap, routing, api, auth, testing

## Symptom
Future agents spend too much time rediscovering project structure and key extension points.

## Root Cause
No local agent-oriented map existed in this repository, and `notes_to_agent/index.md` was empty.

## Correct Fix
Created a persistent orientation layer:

1. Added `AGENTS.md` with:
   - run/test commands
   - route and architecture map
   - auth/session flow pointers
   - cache/query key conventions
   - common debugging paths
   - mandatory notes protocol
2. Added `notes_to_agent/_note_template.md` to standardize future notes.
3. Added structured `notes_to_agent/index.md` with update rules and this initial entry.

## Verification
- Confirmed files exist and are populated:
  - `AGENTS.md`
  - `notes_to_agent/index.md`
  - `notes_to_agent/_note_template.md`
  - `notes_to_agent/2026-02-06-frontend-codebase-orientation.md`

## References
- `AGENTS.md`
- `notes_to_agent/index.md`
- `notes_to_agent/_note_template.md`
- `src/app/router.tsx`
- `src/shared/api/httpClient.ts`
- `src/shared/auth/authApi.ts`
- `src/features/budgets/budgetStore.ts`
