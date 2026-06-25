---
description: Reference guide for React + Vite + Capacitor tech stack used in SpendWise
---

# React Mobile App Tech Stack Reference

## Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI framework |
| **TypeScript** | 5.9.x | Type safety |
| **Vite** | 7.x | Build tool & dev server |
| **Zustand** | 5.x | State management |
| **Dexie** | 4.x | IndexedDB wrapper (local storage) |
| **Chart.js** | 4.x | Data visualization |
| **Lucide React** | 0.5x | Icon library |
| **Capacitor** | 8.x | Native mobile wrapper |
| **Supabase** | 2.x | Cloud backend (auth + database) |

## Project Structure

```
src/
├── App.tsx              # Main app component with routing
├── main.tsx             # Entry point with providers
├── index.css            # All styles (single file approach)
├── components/          # All UI components
├── db/
│   ├── db.ts           # Dexie database schema
│   ├── seed.ts         # Initial data seeding
│   └── supabase.ts     # Supabase client config
├── store/
│   ├── useStore.ts     # Zustand global state
│   ├── useToast.ts     # Toast notifications
│   └── AuthContext.tsx # Authentication context
├── utils/
│   ├── currency.ts     # Formatting utilities
│   └── haptic.ts       # Mobile vibration
└── i18n/
    └── translations.ts # Multi-language support
```

## Key Patterns

### 1. Dexie Database Schema
```typescript
import Dexie, { type EntityTable } from 'dexie';

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  categoryId: number;
  date: string;
  createdAt: number;
}

const db = new Dexie('AppDB') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
};

db.version(1).stores({
  transactions: '++id, type, categoryId, date'
});

export { db };
```

### 2. Zustand Store Pattern
```typescript
import { create } from 'zustand';

interface AppState {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));
```

### 3. Component with Dexie Live Query
```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function MyComponent() {
  const items = useLiveQuery(() => db.items.toArray());
  
  if (!items) return <div>Loading...</div>;
  
  return (
    <div>
      {items.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

### 4. Supabase Authentication
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Sign up
await supabase.auth.signUp({ email, password });

// Sign in
await supabase.auth.signInWithPassword({ email, password });

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### 5. Supabase Data Sync Pattern
```typescript
// Transform keys: camelCase <-> snake_case
const toSnakeCase = (str: string) => 
  str.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);

const toCamelCase = (str: string) =>
  str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());

// Backup to Supabase
const data = await db.items.toArray();
const transformed = data.map(item => transformKeys(item, toSnakeCase));
await supabase.from('items').insert(transformed);
```

## CSS Approach

Single `index.css` file with:
- CSS custom properties (variables)
- Dark/light theme support via `[data-theme]`
- Component sections with clear comments
- Mobile-first responsive design

```css
:root {
  --primary: #6366f1;
  --bg-primary: #0f0f23;
  --card-bg: rgba(30, 30, 46, 0.95);
}

[data-theme="light"] {
  --bg-primary: #f8fafc;
  --card-bg: #ffffff;
}
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Capacitor Integration

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize
npx cap init AppName com.example.app

# Add Android
npx cap add android

# Build and sync
npm run build
npx cap sync android

# Open Android Studio
npx cap open android
```

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npx cap sync     # Sync web assets to native
npx cap open android  # Open Android Studio
```
