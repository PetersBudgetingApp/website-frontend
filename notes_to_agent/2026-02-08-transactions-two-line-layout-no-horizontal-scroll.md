# Unified Transactions Switched To Two-Line Grouped Rows

- Date: 2026-02-08
- Area: transactions-ui
- Tags: responsive, mobile, layout, actions-menu, no-horizontal-scroll

## Symptom
The unified transactions presentation still felt cramped and looked poor on small and mobile screens, even after moving row actions into a menu. Horizontal scrolling for transaction data was not acceptable for this UX.

## Root Cause
A table-first layout optimized for desktop columns forced compression on narrow screens. The information density and control density in one horizontal row made readability and editability degrade quickly as width dropped.

## Correct Fix
Replace the table row model with a two-line grouped transaction row:
- parent row keeps `ID` on the left and centered 3-dot actions on the right
- top line: `Date`, `Description`, `Amount`
- bottom line: `Account`, `Category`, `Notes`
Keep notes editing in the actions menu with autosave behavior, and keep amount values `nowrap`. For secondary wide tables (Transfer Pairs), confine overflow to an internal responsive wrapper. Also enforce global x-axis clipping (`html` and `body`) so the page itself cannot drift horizontally on mobile.

## Verification
- Frontend checks: `npm run typecheck`, `npm run test`, `npm run build`, `npm run check:no-generated-js`
- Manual Playwright MCP smoke on Docker full stack (`http://localhost:3000/transactions`):
  - verified grouped two-line rows render for Unified Transactions
  - verified actions menu still contains Notes / Exclude from totals / Add Rule / Mark Transfer
  - verified notes autosave flow remains intact
  - verified mobile viewport behavior keeps the page from horizontal drift and preserves readable field stacking

## References
- Relevant files and docs:
  - `frontend/src/features/transactions/components/TransactionRow.tsx`
  - `frontend/src/features/transactions/TransactionsPage.tsx`
  - `frontend/src/app/styles.css`
  - `frontend/src/features/transactions/components/TransactionRow.test.tsx`
  - `frontend/AGENTS.md`
