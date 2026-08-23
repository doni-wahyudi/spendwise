# Project Technical Details — SpendWise

SpendWise is a feature-complete, offline-first personal financial tracking Progressive Web App (PWA) with multi-account transaction drilldowns, category click-filtering, budgeting, debts/loans ledger with partial payments, and analytics. It can run in any modern web browser or as a native Android app via Capacitor.

---

## 1. System Overview & Tech Stack
* **Framework:** React 19.2 (Vite 7, TypeScript 5.9)
* **State Management:** Zustand (v5.0.9) - `src/store/useStore.ts`
* **Database/Logic:** Dexie.js (v4.2.1) wrapping IndexedDB for offline-first data storage - `src/db/db.ts` (Version 12)
* **Styling:** Vanilla CSS design system with Dark/Light theme toggle - `src/index.css`
* **Visualization:** Chart.js with React wrappers (`react-chartjs-2`) for expense pie charts, trend charts, and cash flow reports.
* **Internationalization:** Reactive bilingual i18n dictionary (`id` Indonesian / `en` English) - `src/i18n/translations.ts`
* **Native Android Wrapper:** Capacitor (v8.0.0) under the `android/` directory.

---

## 2. Active Routing & Navigation
* **Application Layout:** Single-page dashboard containing conditional view toggles managed by store state.
* **Views/Tabs:**
  * **Dashboard:** Main overview with summary cards, donut charts, heavy spot, full financial report banner, and recent transaction list.
  * **Accounts:** Multi-account balances (Cash, Bank, E-Wallet, etc.), account spending drilldowns, category distribution per account with interactive click-filtering, searchable transaction feeds, manual adjustments, inter-account transfers, and unified transaction editing with account reassignment.
  * **Records:** Full transaction history with custom tags, search, and category/type/period filters.
  * **Reports:** Executive summary KPIs, proportional cash flow allocation, daily outflow charts, and deep category/item drilldowns.
  * **Ledger:** Debts (Hutang) and Receivables (Piutang) tracking, connected directly to accounts and records, featuring partial installment payments, payment history, and progress tracking.
  * **Settings:** Account management, custom categories, budget goals, recurring transactions, cloud backup (Supabase), import/export (JSON/CSV), and language/theme toggling.

---

## 3. Permanently Cleaned Up & Removed Features
* Removed unstyled inline transaction edit modal in `AccountsView.tsx` in favor of the global `TransactionForm` modal.

---

## 4. Key Configurations & Restorations
* **Account Spending Drilldown & Category Filtering:** `src/components/AccountsView.tsx` with category click-filtering, per-account metrics (Total Spent, Income, Net Transfers), category distribution with progress bars, and chronological feed.
* **Database Schema Version:** Dexie v12 supporting enhanced ledger items, partial payments, and account references.
* **Ledger Utilities:** `src/utils/ledgerUtils.ts` providing helpers for remaining debt calculations, progress percentages, and settlement statuses.
* **Git Repository:** Initialized on local branch `android` and synced to remote `https://github.com/doni-wahyudi/spendwise`.
* **Environment Variables:** `.env` configured with Supabase backup URLs for cloud storage.
* **Safety Protocols:** `precautios.md` v1 created to enforce strict safety boundaries.

---

## 5. Guidelines for Future Chats & Agents
* **Aesthetic Standard:** Strictly adhere to vanilla CSS design system and variables located in `src/index.css`. Preserve transitions and contrast rules.
* **Offline-First:** All data operations must go through Dexie (`src/db/db.ts`) to maintain offline capability.
* **Core Rules:** Always read `precautios.md` before performing any tasks and update `plan.md` (or spawn `planvX.md` on version changes) after completing tasks.

---

## 6. Verification Pipeline & Smoke Tests
* Run `npm run dev` to start local development server.
* Run `npx tsc --noEmit` and `npm run build` to verify TypeScript compile and production bundler outputs.
* Build target directories: `dist` (Web PWA) and `android` (Capacitor Android app).
