# Unified Transactions Row Controls Were Cramped On Narrow Screens

- Date: 2026-02-08
- Area: transactions-ui
- Tags: table-layout, responsive, autosave, notes, actions-menu

## Symptom
In Unified Transactions, row controls (Add Rule, Mark Transfer, Exclude, Notes input, Save) were packed directly into table columns. On narrow/vertical screens this caused severe crowding, amount text wrapping risk, and category selects shrinking too aggressively.

## Root Cause
Each row embedded too many interactive controls inline across fixed table columns, and the page/card grid layout allowed wide table content to force document-level horizontal overflow. The table also lacked explicit nowrap/min-width constraints on high-risk columns.

## Correct Fix
Move row-level actions into a per-row 3-dot menu and keep the table focused on core data columns. Notes are edited from that menu and autosaved (debounced) without a Save button. Move Exclude, Add Rule, and Mark Transfer into the same menu. Add explicit column constraints (`nowrap` for amount, fixed minimum width for category select) and render the table inside an internal horizontal-scroll wrapper. Ensure parent grid/card containers use `min-width: 0` so overflow stays inside the wrapper instead of expanding the full page width.

## Verification
- Frontend checks: `npm run typecheck`, `npm run test`, `npm run build`, `npm run check:no-generated-js`
- Targeted test: `src/features/transactions/components/TransactionRow.test.tsx` verifies notes autosave via row menu.
- Manual Playwright MCP smoke on Docker full stack at `http://localhost:3000/transactions`:
  - Verified 3-dot menu contains `Notes`, `Exclude from totals`, `Add Rule`, `Mark Transfer`
  - Verified notes edit persists after autosave and navigation refresh
  - Verified narrow viewport keeps page width stable while table scrolls internally
  - Verified amount column uses `white-space: nowrap`
  - Verified category select keeps fixed minimum width

## References
- Relevant files and docs:
  - `frontend/src/features/transactions/components/TransactionRow.tsx`
  - `frontend/src/features/transactions/components/CategoryPicker.tsx`
  - `frontend/src/features/transactions/TransactionsPage.tsx`
  - `frontend/src/app/styles.css`
  - `frontend/src/features/transactions/components/TransactionRow.test.tsx`
  - `frontend/AGENTS.md`
