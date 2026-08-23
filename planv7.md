# Plan v7 — Category Click-Filtering & Global Transaction Edit Modal

## Goal
1. Allow users to filter the transaction list in the Accounts view by clicking on any category row in the **Pengeluaran per Kategori** (Spending by Category) card.
2. Replace the unstyled inline transaction edit modal with the global, full-featured `TransactionForm` modal so users can edit all fields, including reassigning the **Account** if they selected the wrong account.

## Completed Changes

### 1. Interactive Category Filter in Accounts View
- **[MODIFY] `src/components/AccountsView.tsx`**:
  - Added `selectedCategoryId` state to track active category filter.
  - Category rows in the breakdown card are now interactive buttons with hover highlight, active outline/badge, and accessibility attributes.
  - Clicking a category row filters the activity feed to only show transactions of that category.
  - Clicking the same category again or clicking the **Reset Filter** button clears the filter.
  - Added an active filter notice banner displaying the selected category name with a quick clear button.
  - Switching accounts automatically clears the category filter.

### 2. Transaction Edit Modal Integration with Account Reassignment
- **[MODIFY] `src/components/AccountsView.tsx`**:
  - Replaced the previous ad-hoc unstyled inline modal with the application's global `setEditingTransaction(tx)` action from `useStore`.
  - When clicking edit on any transaction in the account activity feed, the global `TransactionForm` modal appears with full styling, category selector, type selector, and **Account Selector**.
  - Users can change the account if they originally assigned the transaction to the wrong account; balances and activity feeds for both accounts update reactively.
  - Removed duplicate inline edit state (`editingTx`, `editTxAmount`, etc.) and cleaned up DOM markup.

### 3. Internationalization (i18n) & Styles
- **[MODIFY] `src/i18n/translations.ts`**:
  - Added missing keys: `editAccount`, `ewallet`, `investment`, `adjustBalance`.
- **[MODIFY] `src/index.css`**:
  - Added styling for `.category-bar-item:hover`, `.category-bar-item.active-filter`, `.active-cat-badge`, `.category-filter-notice`, `.clear-cat-filter-btn`, and `.clear-cat-filter-mini-btn`.
  - Added Light Theme overrides for all new category filter elements.

## Verification
- Ran `npx tsc --noEmit` and `npm run build`: built production bundle in 3.65s with 0 errors.

## Completion Log
- **What was done**: Enabled category click-filtering in AccountsView, replaced inline edit modal with the global TransactionForm modal with account reassignment support, and added translation keys and styling.
- **Why it was done**: To satisfy user request for category filtering on click and unified transaction editing with account correction.
- **What changed**: `src/components/AccountsView.tsx`, `src/i18n/translations.ts`, `src/index.css`, `planv7.md`, `TECHNICAL_DETAILS.md`, `walkthrough.md`.
- **Unresolved items**: None.
