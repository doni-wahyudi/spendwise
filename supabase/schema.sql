-- ==========================================================
-- SpendWise Full Supabase Database Schema
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ==========================================================

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT PRIMARY KEY,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category_id BIGINT NOT NULL,
    account_id BIGINT,
    date TEXT NOT NULL,
    note TEXT,
    tags JSONB,
    created_at BIGINT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    budget_limit NUMERIC,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT,
    is_default BOOLEAN DEFAULT false,
    manual_balance NUMERIC DEFAULT 0,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. Savings Goals Table
CREATE TABLE IF NOT EXISTS savings_goals (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC NOT NULL,
    deadline TEXT,
    color TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Bill Reminders Table
CREATE TABLE IF NOT EXISTS bill_reminders (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    due_day INT NOT NULL,
    category_id BIGINT,
    is_active BOOLEAN DEFAULT true,
    last_notified TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 6. Transaction Templates Table
CREATE TABLE IF NOT EXISTS transaction_templates (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category_id BIGINT NOT NULL,
    account_id BIGINT,
    note TEXT,
    usage_count INT DEFAULT 0,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 7. Recurring Transactions Table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id BIGINT PRIMARY KEY,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category_id BIGINT NOT NULL,
    account_id BIGINT,
    note TEXT,
    frequency TEXT NOT NULL,
    start_date TEXT NOT NULL,
    last_generated TEXT,
    is_active BOOLEAN DEFAULT true,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 8. Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    created_at BIGINT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 9. Account Transfers Table
CREATE TABLE IF NOT EXISTS account_transfers (
    id BIGINT PRIMARY KEY,
    from_account_id BIGINT NOT NULL,
    to_account_id BIGINT NOT NULL,
    amount NUMERIC NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    created_at BIGINT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 10. Ledger Table (Receivables & Payables with Accounts & Partial Payments)
CREATE TABLE IF NOT EXISTS ledger (
    id BIGINT PRIMARY KEY,
    type TEXT NOT NULL,
    person_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    note TEXT,
    due_date TEXT,
    is_paid BOOLEAN DEFAULT false,
    paid_at BIGINT,
    created_at BIGINT NOT NULL,
    account_id BIGINT,
    initial_transaction_id BIGINT,
    payments JSONB,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 11. User Settings Table (Salary period, preferences)
CREATE TABLE IF NOT EXISTS settings (
    id TEXT NOT NULL,
    value JSONB,
    updated_at BIGINT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    PRIMARY KEY (id, user_id)
);

-- ==========================================================
-- Enable Row Level Security (RLS) on all tables
-- ==========================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- Create RLS Policies (Users can only access their own data)
-- ==========================================================
DO $$ 
DECLARE 
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'transactions', 'categories', 'accounts', 'savings_goals', 
            'bill_reminders', 'transaction_templates', 'recurring_transactions', 
            'tags', 'account_transfers', 'ledger', 'settings'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own data" ON %I;', tbl);
        EXECUTE format('CREATE POLICY "Users can manage own data" ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);', tbl);
    END LOOP;
END $$;

-- ==========================================================
-- Enable Supabase Realtime for Multi-Device Instant Sync (Idempotent)
-- ==========================================================
DO $$ 
DECLARE 
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'transactions', 'categories', 'accounts', 'savings_goals', 
            'bill_reminders', 'transaction_templates', 'recurring_transactions', 
            'tags', 'account_transfers', 'ledger', 'settings'
        ])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I;', tbl);
        END IF;
    END LOOP;
END $$;
