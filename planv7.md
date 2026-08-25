# Plan v7 — Historical Note Autocomplete & Cloud Sync Status Notification System

## Goals
1. Provide historical note autocomplete suggestions with fuzzy matching, usage count, category/amount hints, and one-tap auto-prefill to prevent duplicate/splintered item names in reports.
2. Provide real-time sync notifications and status indicator showing whether data is synced, syncing, offline, or how many records are pending synchronization.

## Completed Changes

### 1. Historical Note Autocomplete (`NoteAutocomplete.tsx` & `TransactionForm.tsx`)
- **[NEW] `src/components/NoteAutocomplete.tsx`**:
  - Custom auto-complete component featuring fuzzy scoring (exact, prefix, substring, character sequence matching).
  - Highlights matching characters with custom mark styling.
  - Displays usage count badges (e.g. `5×`), trending icon (≥3 usages), last amount used, and category color pill.
  - On focus with an empty input, presents the top 8 most frequent items as quick chips.
  - Full keyboard accessibility (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
  - Auto-selects the last used category when a suggestion is clicked if not already chosen.
- **[MODIFY] `src/components/TransactionForm.tsx`**:
  - Integrated `NoteAutocomplete` into the transaction form.
  - Mines history directly from `db.transactions` in memory using `useMemo` with zero database lag.

### 2. Live Cloud Sync Tracking & Unsynced Records Notification (`syncQueue` & `SyncStatusBadge`)
- **[MODIFY] `src/db/db.ts`**:
  - Added `SyncQueueItem` interface and `syncQueue` table to Dexie database schema (Version 13).
- **[MODIFY] `src/db/sync.ts`**:
  - Upgraded synchronization engine with an offline outbox queue in Dexie.
  - Every local change (`creating`, `updating`, `deleting`) adds an item to `db.syncQueue` and attempts debounced processing.
  - Automatically retries and flushes the queue when internet connection restores (`window.addEventListener('online', ...)`).
  - Implemented `fullSync()`, `processSyncQueue()`, and `pullFromSupabase()`.
- **[NEW] `src/hooks/useSyncStatus.ts`**:
  - Live reactive hook tracking `pendingCount` (via `useLiveQuery(() => db.syncQueue.count())`), `isOnline`, `isSyncing`, `lastSyncTime`, `user`, and `syncNow()`.
- **[NEW] `src/components/SyncStatusBadge.tsx`**:
  - Header badge displaying live sync state:
    - **Synced**: `☁️✓ Tersinkron` (Emerald pill)
    - **Syncing**: `🔄 Menyinkronkan...` (Spinning indigo pill)
    - **Unsynced Pending**: `☁️⚠️ X belum sync` with pulsing amber warning pill and exact record count
    - **Offline**: `📡 Offline` (Gray/red pill)
    - **Local Mode**: `☁️ Lokal` (Neutral gray pill)
  - Interactive popover modal displaying connection state, user account, number of unsynced records, last sync timestamp, and **Sync Now (Sinkronkan Sekarang)** trigger button.
- **[MODIFY] `src/App.tsx`**:
  - Positioned `SyncStatusBadge` in the main app header alongside title and settings.
- **[MODIFY] `src/components/CloudBackup.tsx`**:
  - Displays live pending sync count badge in the backup info section.
  - Clears `syncQueue` when full manual backup/restore succeeds.
- **[MODIFY] `src/i18n/translations.ts` & `src/index.css`**:
  - Added bilingual translations for sync states (`id` / `en`).
  - Added styling and light/dark theme overrides for badges, modals, and pending count pills.

## Verification
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: built in 3.62s with 0 errors.

## Completion Log
- **What was done**: Implemented historical note autocomplete with fuzzy search and category prefill, created persistent Dexie-backed syncQueue outbox, and added real-time sync notification badge and details popover with exact pending record counters.
- **Why it was done**: Fulfill user requests for consistent item naming and transparent visibility into sync status and unsynced record counts.
- **What changed**: `src/db/db.ts`, `src/db/sync.ts`, `src/hooks/useSyncStatus.ts`, `src/components/SyncStatusBadge.tsx`, `src/components/NoteAutocomplete.tsx`, `src/components/TransactionForm.tsx`, `src/components/CloudBackup.tsx`, `src/App.tsx`, `src/i18n/translations.ts`, `src/index.css`, `planv7.md`, `TECHNICAL_DETAILS.md`, `walkthrough.md`.
- **Unresolved items**: None.
