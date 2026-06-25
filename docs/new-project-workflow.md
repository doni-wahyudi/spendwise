---
description: Step-by-step workflow to create a new React + Vite + Capacitor mobile app
---

# New React Mobile App Workflow

// turbo-all

## Step 1: Create Project

```bash
# Create new Vite React TypeScript project
npx -y create-vite@latest my-app --template react-ts

cd my-app
npm install
```

## Step 2: Install Core Dependencies

```bash
# State management
npm install zustand

# Local database
npm install dexie dexie-react-hooks

# Charts (if needed)
npm install chart.js react-chartjs-2

# Icons
npm install lucide-react

# Cloud backend (optional)
npm install @supabase/supabase-js
```

## Step 3: Create Project Structure

```bash
# Create directories
mkdir src/db src/store src/utils src/components docs

# Create core files
touch src/db/db.ts
touch src/store/useStore.ts
touch src/store/useToast.ts
touch src/utils/currency.ts
touch .env.example
```

## Step 4: Setup Database (db/db.ts)

Create Dexie database with your schema. Use interfaces for type safety.

Key patterns:
- Auto-increment `++id` for primary keys
- Index frequently queried fields
- Version migrations for schema changes

## Step 5: Setup State Management (store/useStore.ts)

Create Zustand store for:
- UI state (active tab, theme)
- Filter state (date ranges)
- User preferences
- Toast notifications

## Step 6: Create Base Components

Essential components:
1. **App.tsx** - Main layout with navigation
2. **Toast.tsx** - Toast notifications
3. **ThemeToggle.tsx** - Dark/light mode
4. **DateFilter.tsx** - Date range picker (if applicable)

## Step 7: Style with CSS Variables

Use single `index.css` with:
- CSS custom properties for theming
- `[data-theme="light"]` for light mode
- Component sections with comments
- Mobile-first responsive design

## Step 8: Add Capacitor for Mobile

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init "App Name" com.yourname.app

# Add Android platform
npx cap add android
```

## Step 9: Configure Capacitor (capacitor.config.ts)

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.app',
  appName: 'App Name',
  webDir: 'dist'
};

export default config;
```

## Step 10: Setup Supabase (Optional)

1. Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

2. Create `src/db/supabase.ts` with client configuration

3. Create Supabase tables matching your local schema (use snake_case)

## Step 11: Build and Deploy to Android

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open Android Studio
npx cap open android
```

In Android Studio:
- Wait for Gradle sync
- Build → Build Bundle(s) / APK(s) → Build APK(s)

## Component Checklist

### Essential
- [ ] App.tsx (routing, layout)
- [ ] Toast.tsx (notifications)
- [ ] ThemeToggle.tsx
- [ ] Main feature forms

### Common Features
- [ ] CRUD list components
- [ ] Search/filter bar
- [ ] Date range picker
- [ ] Charts/visualizations
- [ ] Settings view
- [ ] Data export/import

### Advanced
- [ ] Onboarding tour
- [ ] Cloud backup/sync
- [ ] Offline support
- [ ] Recurring items
- [ ] Templates/quick actions

## Testing Checklist

- [ ] Dev server works (`npm run dev`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Capacitor sync works (`npx cap sync android`)
- [ ] APK installs on device
- [ ] Data persists after app restart
- [ ] Theme toggle works
- [ ] Cloud sync works (if applicable)
