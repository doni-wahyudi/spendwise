# SpendWise 💰

A modern, offline-first personal finance tracking Progressive Web App (PWA) built with React, TypeScript, and IndexedDB.

![SpendWise](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Vite](https://img.shields.io/badge/Vite-7-646cff)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## ✨ Features Overview

### Core Features
| Feature | Description |
|---------|-------------|
| **Transaction Management** | Add, edit, delete, and duplicate transactions |
| **Categories** | Default + custom categories with color coding |
| **Budget Limits** | Set spending limits per category with progress tracking |
| **Summary Dashboard** | Income, expense, and balance at a glance |
| **Date Filtering** | This month, last month, all time, or custom range |
| **Spending Charts** | Pie chart by category & trend charts |
| **Heavy Spot Analysis** | Identify biggest spending category |

### Multiple Accounts
| Feature | Description |
|---------|-------------|
| **Account Types** | Cash, Bank, E-Wallet, Other |
| **Balance Tracking** | Per-account balance calculation |
| **Default Account** | Set preferred account for new transactions |
| **Account Selector** | Choose account when adding transactions |

### Recurring Transactions
| Feature | Description |
|---------|-------------|
| **Frequencies** | Daily, weekly, monthly, yearly |
| **Auto-generation** | Automatic transaction creation |
| **Enable/Disable** | Toggle recurring transactions |

### Search & Filter
| Feature | Description |
|---------|-------------|
| **Text Search** | Search by transaction note |
| **Category Filter** | Filter by specific category |
| **Type Filter** | Show all, income only, or expense only |

### Tags & Labels
| Feature | Description |
|---------|-------------|
| **Custom Tags** | Add multiple tags per transaction |
| **Autocomplete** | Suggestions from existing tags |
| **Chip Display** | Visual tag chips with removal |

### Reports
| Feature | Description |
|---------|-------------|
| **Monthly Summary** | Income, expense, balance per month |
| **Yearly Summary** | Annual financial overview |
| **Category Breakdown** | Top expenses by category |
| **Expandable Details** | Click to see category breakdown |

### Data Management
| Feature | Description |
|---------|-------------|
| **Export JSON** | Full data backup in JSON format |
| **Export CSV** | Spreadsheet-compatible export |
| **Import JSON** | Restore from JSON backup |
| **Import CSV** | Import from spreadsheet |
| **Clear All Data** | Triple-confirmation data reset |

### UI/UX Features
| Feature | Description |
|---------|-------------|
| **Dark/Light Theme** | Toggle in settings, persisted |
| **Multi-language** | Indonesian (ID) and English (EN) |
| **Toast Notifications** | Feedback on actions |
| **FAB Button** | Quick add from dashboard |
| **Empty State CTAs** | Guides for new users |
| **Swipe to Delete** | Mobile-friendly deletion |
| **Loading Skeletons** | Shimmer animation while loading |
| **Delete Confirmations** | Prevent accidental deletion |

### PWA Features
| Feature | Description |
|---------|-------------|
| **Offline First** | Works without internet (IndexedDB) |
| **Installable** | Add to home screen |
| **Manifest** | App metadata for installation |

---

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Zustand** | State Management |
| **Dexie.js** | IndexedDB Wrapper |
| **Chart.js** | Data Visualization |
| **Lucide React** | Icons |

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── AccountManager.tsx
│   ├── BudgetProgress.tsx
│   ├── DataImport.tsx
│   ├── DateFilter.tsx
│   ├── LanguageToggle.tsx
│   ├── RecurringManager.tsx
│   ├── Reports.tsx
│   ├── SearchFilter.tsx
│   ├── SettingsView.tsx
│   ├── SummaryCards.tsx
│   ├── SummaryChart.tsx
│   ├── TagInput.tsx
│   ├── ThemeToggle.tsx
│   ├── Toast.tsx
│   ├── TransactionForm.tsx
│   ├── TransactionList.tsx
│   └── TrendChart.tsx
├── db/                  # Database layer
│   ├── db.ts           # Dexie schema
│   ├── seed.ts         # Default categories
│   └── seedAccounts.ts # Default accounts
├── i18n/               # Internationalization
│   └── translations.ts # ID/EN strings
├── store/              # State management
│   ├── useStore.ts     # Main app store
│   └── useToast.ts     # Toast notifications
├── utils/              # Utilities
│   ├── currency.ts     # IDR formatting
│   └── dateUtils.ts    # Date helpers
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Styles
```

---

## 💾 Data Models

### Transaction
```typescript
interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  categoryId: number;
  accountId?: number;
  date: string;
  note?: string;
  tags?: string[];
  createdAt: number;
}
```

### Category
```typescript
interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  color: string;
  isDefault?: boolean;
  budgetLimit?: number;
}
```

### Account
```typescript
interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'other';
  color: string;
  isDefault?: boolean;
}
```

### RecurringTransaction
```typescript
interface RecurringTransaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  categoryId: number;
  accountId?: number;
  note?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  lastGenerated?: string;
  isActive: boolean;
}
```

---

## 🎨 Theme Support

The app supports both dark and light themes:

- **Dark Theme** (default): Modern dark UI
- **Light Theme**: Clean, bright interface

Theme preference is persisted in localStorage.

---

## 🌐 Language Support

- 🇮🇩 **Indonesian** (default)
- 🇬🇧 **English**

Language preference is persisted in localStorage.

---

## 📱 PWA Installation

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Or go to Settings → "Add to Home Screen"

---

## � Build Android APK

This project uses **Capacitor** to build native Android APKs.

### Prerequisites
- [Android Studio](https://developer.android.com/studio) installed
- Java JDK 17+ installed

### First-Time Setup
```bash
# Install Capacitor (already done if you cloned this repo)
npm install @capacitor/core @capacitor/cli @capacitor/android

# Add Android platform (already done)
npx cap add android

# Build and sync
npm run build
npx cap sync android
```

### Open in Android Studio
```bash
npx cap open android
```

### Build APK in Android Studio

1. **Wait for Gradle Sync** - First open may take 1-3 minutes
2. **Build Debug APK:**
   - Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Wait for build to complete
   - Click **"locate"** to find the APK

3. **APK Location:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Build Signed Release APK (for Play Store)

1. Go to **Build → Generate Signed Bundle / APK**
2. Select **APK** → Next
3. Create new keystore or use existing
4. Select **release** build variant
5. Click **Finish**

### After Code Changes
```bash
npm run build
npx cap sync android
```

---

## �📄 License

MIT License - Feel free to use and modify!

