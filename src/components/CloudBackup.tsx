import { useState } from 'react';
import { db } from '../db/db';
import { supabase, TABLES } from '../db/supabase';
import { useToast } from '../store/useToast';
import { useAuth } from '../store/AuthContext';
import AuthForm from './AuthForm';
import { Cloud, Upload, Download, Check, AlertCircle, Loader } from 'lucide-react';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// Convert camelCase to snake_case for Supabase
const toSnakeCase = (str: string): string =>
    str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Convert snake_case to camelCase for local DB
const toCamelCase = (str: string): string =>
    str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

// Transform object keys - use any to avoid strict type issues
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

export default function CloudBackup() {
    const { addToast } = useToast();
    const { user, isConfigured } = useAuth();
    const [backupStatus, setBackupStatus] = useState<SyncStatus>('idle');
    const [restoreStatus, setRestoreStatus] = useState<SyncStatus>('idle');
    const [lastBackup, setLastBackup] = useState<string | null>(
        localStorage.getItem('spendwise-last-backup')
    );

    const handleBackup = async () => {
        if (!supabase) {
            addToast('Supabase not configured', 'error');
            return;
        }

        if (!user) {
            addToast('Please sign in first', 'error');
            return;
        }

        setBackupStatus('syncing');
        let hasError = false;

        try {
            // Get all local data
            const transactions = await db.transactions.toArray();
            const categories = await db.categories.toArray();
            const accounts = await db.accounts.toArray();
            const savingsGoals = await db.savingsGoals.toArray();
            const billReminders = await db.billReminders.toArray();
            const templates = await db.transactionTemplates.toArray();
            const recurring = await db.recurringTransactions.toArray();
            const tags = await db.tags.toArray();
            const transfers = await db.accountTransfers.toArray();

            // Add user_id to each record and transform keys
            const addUserId = (arr: any[]) =>
                arr.map(item => ({ ...item, user_id: user.id }));

            const categoriesData = transformArray(addUserId(categories), toSnakeCase);
            const accountsData = transformArray(addUserId(accounts), toSnakeCase);
            const transactionsData = transformArray(addUserId(transactions), toSnakeCase);
            const savingsData = transformArray(addUserId(savingsGoals), toSnakeCase);
            const billsData = transformArray(addUserId(billReminders), toSnakeCase);
            const templatesData = transformArray(addUserId(templates), toSnakeCase);
            const recurringData = transformArray(addUserId(recurring), toSnakeCase);
            const tagsData = transformArray(addUserId(tags), toSnakeCase);
            const transfersData = transformArray(addUserId(transfers), toSnakeCase);

            // Helper to backup a table
            const backupTable = async (tableName: string, data: Record<string, any>[]) => {
                if (data.length === 0 || !supabase) return;

                // Delete existing data for this user
                const deleteResult = await supabase.from(tableName).delete().eq('user_id', user.id);
                if (deleteResult.error) console.warn(`Delete warning for ${tableName}:`, deleteResult.error);

                // Insert new data
                const insertResult = await supabase.from(tableName).insert(data);
                if (insertResult.error) {
                    console.error(`Insert error for ${tableName}:`, insertResult.error);
                    hasError = true;
                }
            };

            await backupTable(TABLES.categories, categoriesData);
            await backupTable(TABLES.accounts, accountsData);
            await backupTable(TABLES.transactions, transactionsData);
            await backupTable(TABLES.savingsGoals, savingsData);
            await backupTable(TABLES.billReminders, billsData);
            await backupTable(TABLES.transactionTemplates, templatesData);
            await backupTable(TABLES.recurringTransactions, recurringData);
            await backupTable('tags', tagsData);
            await backupTable('account_transfers', transfersData);

            // Backup ledger items
            const ledgerItems = await db.ledger.toArray();
            const ledgerData = transformArray(addUserId(ledgerItems), toSnakeCase);
            await backupTable('ledger', ledgerData);

            // Backup settings
            const settingsItems = await db.settings.toArray();
            const settingsData = transformArray(addUserId(settingsItems), toSnakeCase);
            await backupTable('settings', settingsData);

            if (hasError) {
                setBackupStatus('error');
                addToast('Backup completed with errors', 'error');
            } else {
                const timestamp = new Date().toISOString();
                localStorage.setItem('spendwise-last-backup', timestamp);
                setLastBackup(timestamp);
                setBackupStatus('success');
                addToast('Backup successful!', 'success');
            }

            setTimeout(() => setBackupStatus('idle'), 3000);
        } catch (error) {
            console.error('Backup error:', error);
            setBackupStatus('error');
            addToast('Backup failed', 'error');
            setTimeout(() => setBackupStatus('idle'), 3000);
        }
    };

    const handleRestore = async () => {
        if (!supabase) {
            addToast('Supabase not configured', 'error');
            return;
        }

        if (!user) {
            addToast('Please sign in first', 'error');
            return;
        }

        if (!confirm('This will replace all local data. Continue?')) {
            return;
        }

        setRestoreStatus('syncing');

        try {
            // Fetch all data for this user
            const { data: categories } = await supabase.from(TABLES.categories).select('*').eq('user_id', user.id);
            const { data: accounts } = await supabase.from(TABLES.accounts).select('*').eq('user_id', user.id);
            const { data: transactions } = await supabase.from(TABLES.transactions).select('*').eq('user_id', user.id);
            const { data: savingsGoals } = await supabase.from(TABLES.savingsGoals).select('*').eq('user_id', user.id);
            const { data: billReminders } = await supabase.from(TABLES.billReminders).select('*').eq('user_id', user.id);
            const { data: templates } = await supabase.from(TABLES.transactionTemplates).select('*').eq('user_id', user.id);
            const { data: recurring } = await supabase.from(TABLES.recurringTransactions).select('*').eq('user_id', user.id);
            const { data: tags } = await supabase.from('tags').select('*').eq('user_id', user.id);
            const { data: transfers } = await supabase.from('account_transfers').select('*').eq('user_id', user.id);
            const { data: settings } = await supabase.from('settings').select('*').eq('user_id', user.id);

            // Clear local database
            await db.transactions.clear();
            await db.categories.clear();
            await db.accounts.clear();
            await db.savingsGoals.clear();
            await db.billReminders.clear();
            await db.transactionTemplates.clear();
            await db.recurringTransactions.clear();
            await db.tags.clear();
            await db.accountTransfers.clear();
            await db.ledger.clear();
            await db.settings.clear();

            // Remove user_id before storing locally
            const removeUserId = (arr: any[]) =>
                arr.map(({ user_id, ...rest }) => rest);

            // Fetch ledger data
            const { data: ledgerItems } = await supabase.from('ledger').select('*').eq('user_id', user.id);

            // Import with key transformation
            if (categories?.length) await db.categories.bulkAdd(removeUserId(transformArray(categories, toCamelCase)));
            if (accounts?.length) await db.accounts.bulkAdd(removeUserId(transformArray(accounts, toCamelCase)));
            if (transactions?.length) await db.transactions.bulkAdd(removeUserId(transformArray(transactions, toCamelCase)));
            if (savingsGoals?.length) await db.savingsGoals.bulkAdd(removeUserId(transformArray(savingsGoals, toCamelCase)));
            if (billReminders?.length) await db.billReminders.bulkAdd(removeUserId(transformArray(billReminders, toCamelCase)));
            if (templates?.length) await db.transactionTemplates.bulkAdd(removeUserId(transformArray(templates, toCamelCase)));
            if (recurring?.length) await db.recurringTransactions.bulkAdd(removeUserId(transformArray(recurring, toCamelCase)));
            if (tags?.length) await db.tags.bulkAdd(removeUserId(transformArray(tags, toCamelCase)));
            if (transfers?.length) await db.accountTransfers.bulkAdd(removeUserId(transformArray(transfers, toCamelCase)));
            if (ledgerItems?.length) await db.ledger.bulkAdd(removeUserId(transformArray(ledgerItems, toCamelCase)));
            if (settings?.length) await db.settings.bulkAdd(removeUserId(transformArray(settings, toCamelCase)));

            setRestoreStatus('success');
            addToast('Restore successful! Refreshing...', 'success');

            setTimeout(() => {
                setRestoreStatus('idle');
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Restore error:', error);
            setRestoreStatus('error');
            addToast('Restore failed', 'error');
            setTimeout(() => setRestoreStatus('idle'), 3000);
        }
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const getStatusIcon = (status: SyncStatus, defaultIcon: React.ReactNode) => {
        switch (status) {
            case 'syncing': return <Loader size={16} className="spin" />;
            case 'success': return <Check size={16} />;
            case 'error': return <AlertCircle size={16} />;
            default: return defaultIcon;
        }
    };

    return (
        <section className="settings-section cloud-backup">
            <div className="section-header">
                <h3><Cloud size={18} /> Cloud Backup</h3>
            </div>

            {!isConfigured ? (
                <div className="backup-not-configured">
                    <AlertCircle size={20} />
                    <p>Supabase not configured.</p>
                    <p className="help-text">
                        Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code>
                    </p>
                </div>
            ) : !user ? (
                <div className="auth-required">
                    <p className="auth-message">Sign in to backup your data to the cloud</p>
                    <AuthForm />
                </div>
            ) : (
                <div className="backup-actions">
                    <AuthForm />

                    <div className="backup-info">
                        {lastBackup ? (
                            <span>Last backup: {formatDate(lastBackup)}</span>
                        ) : (
                            <span>No backup yet</span>
                        )}
                    </div>

                    <div className="backup-buttons">
                        <button
                            onClick={handleBackup}
                            disabled={backupStatus === 'syncing'}
                            className={`backup-btn ${backupStatus}`}
                        >
                            {getStatusIcon(backupStatus, <Upload size={16} />)}
                            {backupStatus === 'syncing' ? 'Backing up...' : 'Backup Now'}
                        </button>

                        <button
                            onClick={handleRestore}
                            disabled={restoreStatus === 'syncing'}
                            className={`restore-btn ${restoreStatus}`}
                        >
                            {getStatusIcon(restoreStatus, <Download size={16} />)}
                            {restoreStatus === 'syncing' ? 'Restoring...' : 'Restore'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
