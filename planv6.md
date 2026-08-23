# Plan v6 — Ledger Connection to Accounts & Records with Partial Payments

## Goal
Connect the **Ledger (Buku Besar / Hutang-Piutang)** system with **Accounts (Akun)** and **Records (Catatan Transaksi)**, and introduce a full **Partial Payment (Cicilan / Pembayaran Sebagian)** architecture with payment history, visual progress tracking, and cascade transaction management.

## Completed Changes

### 1. Data Layer & Schema
- **[MODIFY] `src/db/db.ts`**:
  - Added `LedgerPayment` interface (`id`, `amount`, `date`, `accountId`, `transactionId`, `note`, `createdAt`).
  - Extended `LedgerItem` interface with `accountId`, `initialTransactionId`, and `payments: LedgerPayment[]`.
  - Added Dexie `db.version(12)` supporting enhanced ledger fields while preserving backward compatibility.
- **[NEW] `src/utils/ledgerUtils.ts`**:
  - Created calculation helpers: `getLedgerPaidAmount`, `getLedgerRemainingAmount`, `getLedgerProgressPercent`, and `getLedgerStatus` ('unpaid' | 'partial' | 'paid').
- **[MODIFY] `supabase/schema.sql`**:
  - Updated `ledger` table definition to include `account_id BIGINT`, `initial_transaction_id BIGINT`, and `payments JSONB`.

### 2. User Interface & Components
- **[MODIFY] `src/components/LedgerView.tsx`**:
  - **Account & Records Integration upon Creation**:
    - Users can link an account when creating a Receivable (loan disbursement) or Payable (loan receipt).
    - When checked, automatically creates a corresponding transaction in `db.transactions` so account balances and record views reflect cash flow.
  - **Partial Payment Modal**:
    - Dynamic amount input prefilled with remaining balance but editable to any partial installment amount.
    - Quick percentage preset pills: "Pay Full (Remaining)", "50%", "25%".
    - Account selector for paying/receiving funds.
    - Optional transaction recording in `db.transactions`.
    - Date and note fields.
  - **Payment History Accordion / Drawer**:
    - Expandable payment history list per ledger item showing date, amount, account used, and custom notes.
    - Ability to delete a specific partial payment with automatic deletion of the linked transaction and restoration of remaining debt balance.
  - **Cascade Deletion**:
    - Deleting a ledger entry automatically deletes its initial transaction and all partial payment transactions from `db.transactions`.
  - **Visual Badges & Progress Bars**:
    - Added color-coded status badges: `Paid` (green), `Partial (X%)` (amber/blue gradient), `Unpaid` (red).
    - Smooth animated progress bar showing repayment completion percentage.
  - **KPI Metrics & Filter Pills**:
    - Top KPI cards displaying remaining receivable and payable amounts, with collected/settled stats.
    - Sub-filters: `Active` (unpaid + partial), `All`, `Settled` (paid).

### 3. Internationalization (i18n)
- **[MODIFY] `src/i18n/translations.ts`**:
  - Added full bilingual dictionary entries (Indonesian & English) for:
    - `recordPayment`, `paymentHistory`, `remaining`, `paidSoFar`, `partialPaid`, `recordInTransactions`, `disburseFromAccount`, `receiveIntoAccount`, `payFull`, `noPaymentsYet`, `paymentAdded`, `paymentDeleted`, `deletePaymentConfirm`, `toReceive`, `toPay`, `receivables`, `payables`, `addReceivable`, `addPayable`, `activeLedger`, `allLedger`, `settledLedger`, `sourceAccount`, `paymentAmount`, `paymentAmountError`.

### 4. Styles & Design System
- **[MODIFY] `src/index.css`**:
  - Added modern glassmorphic card layouts, progress bar animations, modal debt summary banners, quick percentage preset pills, payment history items, and light/dark theme contrast rules.

## Verification
- Ran `npx tsc --noEmit` and `npm run build`: built successfully with 0 TypeScript or bundling errors.
- Verified calculations for partial payments, remaining balances, account synchronization, and cascade deletions.

## Completion Log
- **What was done**: Connected the Ledger to accounts and transaction records, implemented a partial payment and installment system with payment history, visual progress bars, cascade deletion, and full bilingual support.
- **Why it was done**: To satisfy user request that debts and loans connect directly with account balances and records, and support partial payments.
- **What changed**: `src/db/db.ts`, `src/utils/ledgerUtils.ts`, `src/i18n/translations.ts`, `src/components/LedgerView.tsx`, `src/index.css`, `supabase/schema.sql`, `planv6.md`.
- **Unresolved items**: None.
