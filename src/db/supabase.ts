import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Replace these with your own Supabase project credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Database table names
export const TABLES = {
    transactions: 'transactions',
    categories: 'categories',
    accounts: 'accounts',
    savingsGoals: 'savings_goals',
    billReminders: 'bill_reminders',
    transactionTemplates: 'transaction_templates',
    recurringTransactions: 'recurring_transactions'
};
