import { db } from './db';
import { supabase } from './supabase';

let isSyncingFromServer = false;
let isProcessingQueue = false;
let syncDebounceTimer: any = null;

export const setSyncingFromServer = (val: boolean) => {
    isSyncingFromServer = val;
};

// Map of Dexie table names to Supabase table names
const TABLE_MAP: Record<string, string> = {
    transactions: 'transactions',
    categories: 'categories',
    accounts: 'accounts',
    savingsGoals: 'savings_goals',
    billReminders: 'bill_reminders',
    transactionTemplates: 'transaction_templates',
    recurringTransactions: 'recurring_transactions',
    tags: 'tags',
    accountTransfers: 'account_transfers',
    ledger: 'ledger',
    settings: 'settings'
};

// Convert camelCase to snake_case for Supabase
const toSnakeCase = (str: string): string =>
    str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Convert snake_case to camelCase for local DB
const toCamelCase = (str: string): string =>
    str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

// Transform object keys
const transformKeys = (obj: Record<string, any>, transformer: (key: string) => string): Record<string, any> => {
    const result: Record<string, any> = {};
    for (const key in obj) {
        result[transformer(key)] = obj[key];
    }
    return result;
};

// Transform array of objects
const transformArray = (arr: any[], transformer: (key: string) => string): Record<string, any>[] =>
    arr.map(item => transformKeys(item, transformer));

// Enqueue a local change into Dexie syncQueue
export const addToSyncQueue = async (
    tableName: string,
    action: 'upsert' | 'delete',
    entityId: number | string,
    payload?: any
) => {
    if (isSyncingFromServer) return;

    try {
        // Check if there is already a pending item for this table and entity
        const existing = await db.syncQueue
            .where('tableName')
            .equals(tableName)
            .filter(item => String(item.entityId) === String(entityId))
            .first();

        if (existing && existing.id) {
            await db.syncQueue.update(existing.id, {
                action,
                payload: action === 'upsert' ? payload : undefined,
                createdAt: Date.now()
            });
        } else {
            await db.syncQueue.add({
                tableName,
                action,
                entityId,
                payload: action === 'upsert' ? payload : undefined,
                createdAt: Date.now()
            });
        }

        // Trigger debounced queue processing
        triggerSyncDebounced();
    } catch (e) {
        console.error('Error adding to syncQueue:', e);
    }
};

// Process pending syncQueue items to Supabase
export const processSyncQueue = async (): Promise<{ processed: number; remaining: number }> => {
    if (isProcessingQueue || isSyncingFromServer || !supabase || !navigator.onLine) {
        const count = await db.syncQueue.count().catch(() => 0);
        return { processed: 0, remaining: count };
    }

    try {
        isProcessingQueue = true;
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
            const count = await db.syncQueue.count().catch(() => 0);
            return { processed: 0, remaining: count };
        }

        const queueItems = await db.syncQueue.toArray();
        if (queueItems.length === 0) {
            return { processed: 0, remaining: 0 };
        }

        let processedCount = 0;

        for (const item of queueItems) {
            const supabaseTableName = TABLE_MAP[item.tableName];
            if (!supabaseTableName) {
                // Remove invalid table queue item
                if (item.id) await db.syncQueue.delete(item.id);
                continue;
            }

            try {
                if (item.action === 'upsert') {
                    // Fetch latest data if payload missing or outdated
                    let record = item.payload;
                    if (!record) {
                        const table = (db as any)[item.tableName];
                        if (table) {
                            record = await table.get(item.entityId);
                        }
                    }

                    if (record) {
                        const recordWithUser = { ...record, user_id: user.id };
                        const transformed = transformKeys(recordWithUser, toSnakeCase);

                        const { error } = await supabase.from(supabaseTableName).upsert(transformed);
                        if (error) {
                            console.error(`Error syncing upsert for ${supabaseTableName}:`, error);
                            continue; // Keep in queue to retry later
                        }
                    }
                } else if (item.action === 'delete') {
                    const { error } = await supabase
                        .from(supabaseTableName)
                        .delete()
                        .eq('id', item.entityId)
                        .eq('user_id', user.id);

                    if (error) {
                        console.error(`Error syncing delete for ${supabaseTableName}:`, error);
                        continue; // Keep in queue to retry later
                    }
                }

                // Successfully synced item: remove from syncQueue
                if (item.id) {
                    await db.syncQueue.delete(item.id);
                    processedCount++;
                }
            } catch (err) {
                console.error(`Error processing sync item ${item.tableName} #${item.entityId}:`, err);
            }
        }

        const remainingCount = await db.syncQueue.count().catch(() => 0);
        if (remainingCount === 0) {
            localStorage.setItem('spendwise-last-sync-time', new Date().toISOString());
        }

        return { processed: processedCount, remaining: remainingCount };
    } catch (e) {
        console.error('Error during processSyncQueue:', e);
        const count = await db.syncQueue.count().catch(() => 0);
        return { processed: 0, remaining: count };
    } finally {
        isProcessingQueue = false;
    }
};

// Debounced sync trigger (300ms)
export const triggerSyncDebounced = () => {
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
        processSyncQueue();
    }, 300);
};

// Register Dexie hooks for local changes across all mapped tables
const registerDexieHooks = () => {
    Object.keys(TABLE_MAP).forEach(tableName => {
        const table = (db as any)[tableName];
        if (!table) return;

        table.hook('creating', function (this: any, primKey: any, obj: any) {
            const cloned = { ...obj };
            this.onsuccess = function (actualKey: any) {
                addToSyncQueue(tableName, 'upsert', actualKey ?? primKey, { ...cloned, id: actualKey ?? primKey });
            };
        });

        table.hook('updating', function (this: any, mods: any, primKey: any, obj: any) {
            const updatedObj = { ...obj, ...mods, id: primKey };
            this.onsuccess = function () {
                addToSyncQueue(tableName, 'upsert', primKey, updatedObj);
            };
        });

        table.hook('deleting', function (this: any, primKey: any, _obj: any) {
            this.onsuccess = function () {
                addToSyncQueue(tableName, 'delete', primKey);
            };
        });
    });
};

// Initialize hooks immediately
registerDexieHooks();

// Listen for network reconnect to auto-flush offline syncQueue
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('[Sync] Network connection restored, flushing sync queue...');
        processSyncQueue();
    });
}

// Pull all data from Supabase and merge with local Dexie
export const pullFromSupabase = async () => {
    if (!supabase || !navigator.onLine) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        setSyncingFromServer(true);

        for (const [dexieName, supabaseName] of Object.entries(TABLE_MAP)) {
            const { data, error } = await supabase.from(supabaseName)
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error(`Error pulling from Supabase for ${supabaseName}:`, error);
                continue;
            }

            if (data && data.length > 0) {
                const camelCased = transformArray(data, toCamelCase).map(({ userId, ...rest }) => rest);
                const table = (db as any)[dexieName];
                if (table) {
                    await table.bulkPut(camelCased);
                }
            }
        }

        localStorage.setItem('spendwise-last-sync-time', new Date().toISOString());
    } catch (e) {
        console.error('Error during pull from Supabase:', e);
    } finally {
        setSyncingFromServer(false);
    }
};

// Full synchronization (Push Pending + Pull Remote)
export const fullSync = async (): Promise<{ success: boolean; remaining: number; error?: string }> => {
    if (!supabase) {
        return { success: false, remaining: 0, error: 'Supabase is not configured' };
    }
    if (!navigator.onLine) {
        const count = await db.syncQueue.count().catch(() => 0);
        return { success: false, remaining: count, error: 'Offline' };
    }

    try {
        await processSyncQueue();
        await pullFromSupabase();
        const finalRemaining = await db.syncQueue.count().catch(() => 0);
        return { success: finalRemaining === 0, remaining: finalRemaining };
    } catch (e: any) {
        const count = await db.syncQueue.count().catch(() => 0);
        return { success: false, remaining: count, error: e?.message || 'Sync failed' };
    }
};

// Supabase Realtime channel state
let realtimeChannel: any = null;

// Subscribe to real-time updates from Supabase
export const startRealtimeSubscription = async () => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    if (realtimeChannel) {
        realtimeChannel.unsubscribe();
    }

    realtimeChannel = supabase
        .channel('schema-db-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public' },
            async (payload: any) => {
                const { eventType, table: supabaseTableName, new: newRecord, old: oldRecord } = payload;

                const dexieTableName = Object.keys(TABLE_MAP).find(key => TABLE_MAP[key] === supabaseTableName);
                if (!dexieTableName) return;

                const table = (db as any)[dexieTableName];
                if (!table) return;

                const recordToCheck = eventType === 'DELETE' ? oldRecord : newRecord;
                if (recordToCheck?.user_id !== user.id) return;

                setSyncingFromServer(true);
                try {
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const camelCased = transformKeys(newRecord, toCamelCase);
                        delete camelCased.userId;
                        await table.put(camelCased);
                    } else if (eventType === 'DELETE') {
                        await table.delete(oldRecord.id);
                    }
                } catch (err) {
                    console.error(`Error applying realtime event ${eventType} on ${dexieTableName}:`, err);
                } finally {
                    setSyncingFromServer(false);
                }
            }
        )
        .subscribe((status: string) => {
            console.log(`Supabase Realtime subscription status: ${status}`);
        });
};

// Unsubscribe from real-time events on logout
export const unsubscribeRealtime = () => {
    if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        realtimeChannel = null;
    }
};
