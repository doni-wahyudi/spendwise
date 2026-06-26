# Plan v4 — Real-time Bidirectional Database Sync (Dexie & Supabase)

## Goal
Implement automated, real-time bidirectional synchronization between the local Dexie (IndexedDB) database and the remote Supabase cloud database. Any data created, updated, or deleted locally should immediately reflect in Supabase, and any remote database mutations should propagate to local storage instantly using Supabase Realtime subscriptions.

## Proposed Changes

### 1. New Sync Manager (`src/db/sync.ts`)
- **[NEW] `src/db/sync.ts`**: Implement the core sync logic, including:
  1. A state flag `isSyncingFromServer` to prevent infinite replication loops.
  2. Generic Dexie table hooks (`creating`, `updating`, `deleting`) for all 10 local tables that capture local writes and upsert/delete them on Supabase.
  3. A `pullFromSupabase()` function to fetch all remote user records and bulkPut them locally on initial load/login.
  4. A `startRealtimeSubscription()` function utilizing Supabase's `.channel().on('postgres_changes')` listener to capture insert/update/delete events in real-time and apply them locally to Dexie.
  5. An `unsubscribeRealtime()` function to tear down the listener on logout.

### 2. Hook into Auth Context (`src/store/AuthContext.tsx`)
- **[MODIFY] `src/store/AuthContext.tsx`**: Import the sync methods and call them inside the auth state listener:
  - On user login (new active session): trigger `pullFromSupabase()` followed by `startRealtimeSubscription()`.
  - On user logout: call the unsubscribe function.

### 3. Register Sync on Launch (`src/main.tsx`)
- **[MODIFY] `src/main.tsx`**: Import `src/db/sync` to ensure Dexie hooks are registered on startup.

## Verification Plan

### Local Verification
1. Verify build compiles with the new sync module:
   ```bash
   npm run build
   ```
2. Test local changes: add/edit/delete a transaction and verify that the corresponding queries are sent to Supabase (visible via console logs or remote dashboard).
3. Verify that logging in triggers a pull and updates the local IndexedDB state.
