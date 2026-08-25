# Project Technical Details — SpendWise

SpendWise is a feature-complete, offline-first personal financial tracking Progressive Web App (PWA) with multi-account transaction drilldowns, category click-filtering, historical item autocomplete, debts/loans ledger with partial payments, live cloud sync status tracking, and analytics. It can run in any modern web browser or as a native Android app via Capacitor.

---

## 1. System Overview & Tech Stack
* **Framework:** React 19.2 (Vite 7, TypeScript 5.9)
* **State Management:** Zustand (v5.0.9) - `src/store/useStore.ts`
* **Database/Logic:** Dexie.js (v4.2.1) wrapping IndexedDB for offline-first data storage - `src/db/db.ts` (Version 13 with `syncQueue`)
* **Cloud Sync Engine:** Supabase PostgreSQL backend with Dexie outbox queue (`src/db/sync.ts`) and real-time live queries (`src/hooks/useSyncStatus.ts`).
* **Styling:** Vanilla CSS design system with Dark/Light theme toggle - `src/index.css`
* **Visualization:** Chart.js with React wrappers (`react-chartjs-2`) for expense pie charts, trend charts, and cash flow reports.
* **Internationalization:** Reactive bilingual i18n dictionary (`id` Indonesian / `en` English) - `src/i18n/translations.ts`
* **Native Android Wrapper:** Capacitor (v8.0.0) under the `android/` directory.

---

## 2. Active Routing & Navigation
* **Application Layout:** Single-page dashboard containing conditional view toggles managed by store state.
* **Views/Tabs:**
  * **Dashboard:** Main overview with summary cards, donut charts, heavy spot, full financial report banner, sync status badge, and recent transaction list.
  * **Accounts:** Multi-account balances (Cash, Bank, E-Wallet, etc.), account spending drilldowns, category distribution per account with interactive click-filtering, searchable transaction feeds, manual adjustments, inter-account transfers, and unified transaction editing with account reassignment.
  * **Records:** Full transaction history with custom tags, search, and category/type/period filters.
  * **Reports:** Executive summary KPIs, proportional cash flow allocation, daily outflow charts, and deep category/item drilldowns.
  * **Ledger:** Debts (Hutang) and Receivables (Piutang) tracking, connected directly to accounts and records, featuring partial installment payments, payment history, and progress tracking.
  * **Settings:** Account management, custom categories, budget goals, recurring transactions, cloud backup (Supabase), import/export (JSON/CSV), and language/theme toggling.

---

## 3. Cloud Sync & Offline Outbox Architecture
* **`syncQueue` Dexie Table:** Tracks all local changes (`upsert`, `delete`, `tableName`, `entityId`, `payload`).
* **Auto-Flush & Reconnect:** Automatically processes pending queue items on change and when network connection returns (`window.addEventListener('online', ...)`).
* **Live Status Badge (`SyncStatusBadge.tsx`):** Displays real-time sync state (Synced, Syncing, Pending Unsynced with exact record count, Offline, or Local Mode) and offers a one-click manual sync action.

---

## 4. Key Configurations & Restorations
* **Historical Item Autocomplete:** `src/components/NoteAutocomplete.tsx` with fuzzy matching, recency/frequency ranking, highlighted characters, and category auto-prefill.
* **Database Schema Version:** Dexie v13 supporting `syncQueue`, enhanced ledger items, partial payments, and account references.
* **Git Repository:** Initialized on local branch `android` and synced to remote `https://github.com/doni-wahyudi/spendwise`.
* **Safety Protocols:** `precautios.md` v1 created to enforce strict safety boundaries.

---

## 5. Verification Pipeline & Smoke Tests
* Run `npm run dev` to start local development server.
* Run `npx tsc --noEmit` and `npm run build` to verify TypeScript compile and production bundler outputs.
* Build target directories: `dist` (Web PWA) and `android` (Capacitor Android app).
