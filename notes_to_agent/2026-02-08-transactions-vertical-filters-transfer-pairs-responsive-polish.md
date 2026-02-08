# Transactions Responsive Polish: Vertical Monitor, Mobile Filters, Transfer Pairs

- Date: 2026-02-08
- Area: transactions-ui
- Tags: responsive, vertical-monitor, filters, transfer-pairs, mobile

## Symptom
After the two-line unified row redesign, three UX issues remained:
- at vertical-monitor widths, unified rows collapsed into an uneven two-column layout too early
- mobile Filters became compressed and unreadable
- Transfer Pairs still used an inconsistent layout model versus Unified Transactions
- at mid-range widths (between mobile and desktop), three-inline grouped fields still looked cramped

## Root Cause
- `@media (max-width: 1080px)` forced `.transaction-entry-line` to two columns before the layout needed it.
- Filters had a fixed 6-column grid with no intermediate mobile/tablet breakpoints.
- Transfer Pairs retained table-like assumptions instead of sharing the grouped row system.
- keeping 3-inline grouped fields all the way down to mobile made the in-between viewport density too high
- follow-up regression: field-level `grid-area` assignments were initially applied globally, which caused label/content overlap outside the dedicated mid-range layout

## Correct Fix
- Kept grouped transaction rows at three fields per line on desktop and vertical-monitor widths.
- Added a dedicated mid breakpoint (`561px` to `760px`) with explicit field areas:
  - unified rows: `date/amount`, then `description`, `account`, `category`, `notes`
  - transfer rows: `date/amount`, then `description`, `from account`, `to account`, `type`
- For the mid breakpoint, flattened line wrappers with `display: contents` and drove placement via per-field `grid-area` classes.
- Scoped those field `grid-area` classes to the mid breakpoint only (`561px` to `760px`) so desktop and mobile retain their native grid flow.
- Kept mobile collapse to single-column fields at `<= 560px`.
- Added responsive Filters grid breakpoints: 6 columns desktop, 3 medium, 2 tablet, 1 mobile.
- Made the Transfers filter checkbox row span full width on smaller breakpoints.
- Rebuilt Transfer Pairs into grouped parent/child rows with the same responsive collapse pattern as Unified Transactions.
- Applied the same parent-row area mapping for unified + transfer rows (`ID/actions` top, grouped content below).

## Verification
- Frontend checks: `npm run typecheck`, `npm run test`, `npm run build`, `npm run check:no-generated-js`
- Playwright MCP smoke on Docker full stack (`/transactions`) covering:
  - vertical-monitor style viewport with consistent 3-field grouped lines
  - mid-range viewport with explicit stacked field areas and full-width category control
  - mobile viewport with readable 1-column Filters layout
  - transfer pairs rendering as grouped rows with responsive collapse

## References
- `frontend/src/app/styles.css`
- `frontend/src/features/transactions/TransactionsPage.tsx`
- `frontend/src/features/transactions/components/TransactionRow.tsx`
- `frontend/src/features/transactions/components/TransferPairRow.tsx`
- `frontend/AGENTS.md`
