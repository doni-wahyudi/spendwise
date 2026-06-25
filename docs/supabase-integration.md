---
description: Guide for integrating Supabase authentication and cloud backup
---

# Supabase Integration Guide

## 1. Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get URL and anon key from Settings → API

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Client Configuration (db/supabase.ts)
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export const isSupabaseConfigured = (): boolean => {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};
```

## 2. Authentication

### AuthContext Pattern (store/AuthContext.tsx)
```typescript
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../db/supabase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => setUser(session?.user ?? null)
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string) => {
        if (!supabase) return { error: new Error('Not configured') };
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error as Error | null };
    };

    const signIn = async (email: string, password: string) => {
        if (!supabase) return { error: new Error('Not configured') };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error as Error | null };
    };

    const signOut = async () => {
        if (supabase) await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be in AuthProvider');
    return context;
};
```

### Wrap App with Provider (main.tsx)
```typescript
import { AuthProvider } from './store/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <AuthProvider>
        <App />
    </AuthProvider>
);
```

## 3. Data Sync Pattern

### Key Transformation (camelCase ↔ snake_case)
```typescript
const toSnakeCase = (str: string) => 
    str.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);

const toCamelCase = (str: string) =>
    str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());

const transformKeys = (obj: any, fn: (k: string) => string) => {
    const result: any = {};
    for (const key in obj) result[fn(key)] = obj[key];
    return result;
};

const transformArray = (arr: any[], fn: (k: string) => string) =>
    arr.map(item => transformKeys(item, fn));
```

### Backup to Supabase
```typescript
const backupData = async (user: User) => {
    const items = await db.items.toArray();
    const data = items.map(item => ({
        ...transformKeys(item, toSnakeCase),
        user_id: user.id
    }));
    
    await supabase.from('items').delete().eq('user_id', user.id);
    await supabase.from('items').insert(data);
};
```

### Restore from Supabase
```typescript
const restoreData = async (user: User) => {
    const { data } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id);
    
    await db.items.clear();
    
    const transformed = data?.map(({ user_id, ...rest }) => 
        transformKeys(rest, toCamelCase)
    ) || [];
    
    await db.items.bulkAdd(transformed);
};
```

## 4. Database Tables SQL

**Important**: Supabase uses **snake_case** for column names!

```sql
-- Example: Items table with user association
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount NUMERIC,
    created_at BIGINT,
    user_id UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow users to access only their own data
CREATE POLICY "Users access own data" ON items
    FOR ALL USING (auth.uid() = user_id);
```

## 5. Enable Email Auth

In Supabase Dashboard:
1. Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)

## 6. Security Tips

1. **Always add `user_id`** to tables for multi-user support
2. **Enable RLS** (Row Level Security) on all tables
3. **Never expose service key** - only use anon key in frontend
4. **Validate on server** if using edge functions
5. **Use type imports** for TypeScript:
   ```typescript
   import type { User, Session } from '@supabase/supabase-js';
   ```
