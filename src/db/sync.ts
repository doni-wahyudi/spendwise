import { db } from './db';
import { supabase } from './supabase';

let isSyncingFromServer = false;

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
    ledger: 'ledger'
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

// Sync local Dexie changes to Supabase
const syncLocalToRemote = async (tableName: string, eventType: 'upsert' | 'delete', record: any) => {
    if (isSyncingFromServer || !supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const supabaseTableName = TABLE_MAP[tableName];
        if (!supabaseTableName) return;

        if (eventType === 'upsert') {
            // Include user_id and transform to snake_case
            const recordWithUser = { ...record, user_id: user.id };
            const transformed = transformKeys(recordWithUser, toSnakeCase);
            
            const { error } = await supabase.from(supabaseTableName).upsert(transformed);
            if (error) {
                console.error(`Error syncing upsert to Supabase for ${supabaseTableName}:`, error);
            }
        } else if (eventType === 'delete') {
            const { error } = await supabase.from(supabaseTableName)
                .delete()
                .eq('id', record.id)
                .eq('user_id', user.id);
            if (error) {
                console.error(`Error syncing delete to Supabase for ${supabaseTableName}:`, error);
            }
        }
    } catch (e) {
        console.error(`Unexpected sync error on local-to-remote update for ${tableName}:`, e);
    }
};

// Register Dexie hooks for local changes
const registerDexieHooks = () => {
    Object.keys(TABLE_MAP).forEach(tableName => {
        const table = (db as any)[tableName];
        if (!table) return;

        table.hook('creating', function (this: any, _primKey: any, obj: any) {
            this.onsuccess = function (actualKey: any) {
                syncLocalToRemote(tableName, 'upsert', { ...obj, id: actualKey });
            };
        });

        table.hook('updating', function (this: any, _mods: any, _primKey: any, _obj: any) {
            this.onsuccess = function (updatedObj: any) {
                syncLocalToRemote(tableName, 'upsert', updatedObj);
            };
        });

        table.hook('deleting', function (this: any, primKey: any, _obj: any) {
            this.onsuccess = function () {
                syncLocalToRemote(tableName, 'delete', { id: primKey });
            };
        });
    });
};

// Initialize hooks immediately
registerDexieHooks();

// Pull all data from Supabase and merge with local Dexie
export const pullFromSupabase = async () => {
    if (!supabase) return;
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
    } catch (e) {
        console.error('Error during initial pull from Supabase:', e);
    } finally {
        setSyncingFromServer(false);
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
