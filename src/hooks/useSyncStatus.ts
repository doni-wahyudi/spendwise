import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { fullSync, processSyncQueue } from '../db/sync';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/useToast';
import { useStore } from '../store/useStore';
import { t } from '../i18n/translations';

export type SyncState = 'synced' | 'syncing' | 'pending' | 'offline' | 'unauthenticated' | 'not_configured';

export function useSyncStatus() {
    const { user, isConfigured } = useAuth();
    const { addToast } = useToast();
    const { language } = useStore();
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(
        typeof window !== 'undefined' ? localStorage.getItem('spendwise-last-sync-time') : null
    );

    // Live query for pending items in syncQueue
    const pendingCount = useLiveQuery(() => db.syncQueue.count(), [], 0);

    // Track online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Automatically process any pending items when reconnected
            processSyncQueue().then(({ remaining }) => {
                if (remaining === 0) {
                    setLastSyncTime(new Date().toISOString());
                }
            });
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Manual sync action
    const syncNow = useCallback(async (showNotification = true) => {
        if (!isConfigured) {
            if (showNotification) addToast(t(language, 'notSignedIn'), 'info');
            return;
        }
        if (!isOnline) {
            if (showNotification) addToast(t(language, 'offlineMode'), 'info');
            return;
        }
        if (!user) {
            if (showNotification) addToast(t(language, 'notSignedIn'), 'info');
            return;
        }

        setIsSyncing(true);
        try {
            const { success, remaining, error } = await fullSync();
            const nowIso = new Date().toISOString();
            setLastSyncTime(nowIso);

            if (showNotification) {
                if (success) {
                    addToast(t(language, 'syncSuccess') + ' ✓', 'success');
                } else if (remaining > 0) {
                    addToast(`${remaining} ${t(language, 'recordsUnsynced')}`, 'info');
                } else if (error) {
                    addToast(t(language, 'syncError') + `: ${error}`, 'error');
                }
            }
        } catch (err: any) {
            console.error('Manual sync failed:', err);
            if (showNotification) addToast(t(language, 'syncError'), 'error');
        } finally {
            setIsSyncing(false);
        }
    }, [isConfigured, isOnline, user, language, addToast]);

    // Determine aggregate sync state
    let syncState: SyncState = 'synced';
    if (isSyncing) {
        syncState = 'syncing';
    } else if (!isOnline) {
        syncState = 'offline';
    } else if (!isConfigured) {
        syncState = 'not_configured';
    } else if (!user) {
        syncState = 'unauthenticated';
    } else if (pendingCount > 0) {
        syncState = 'pending';
    } else {
        syncState = 'synced';
    }

    return {
        syncState,
        pendingCount,
        isOnline,
        isSyncing,
        lastSyncTime,
        user,
        isConfigured,
        syncNow
    };
}
