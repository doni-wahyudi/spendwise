import Dexie, { type EntityTable } from 'dexie';

// Define Interface for Transaction
export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  categoryId: number;
  accountId?: number;
  date: string;
  note?: string;
  tags?: string[]; // Array of tag names
  createdAt: number;
}

// Define Interface for Category
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  color: string;
  isDefault?: boolean;
  budgetLimit?: number;
}

// Define Interface for Recurring Transaction
export interface RecurringTransaction {
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

// Define Interface for Account
export interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'other';
  color: string;
  icon?: string;
  isDefault?: boolean;
  manualBalance?: number; // Manual balance adjustment (for corrections without transactions)
}

// Define Interface for Savings Goal
export interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  createdAt: number;
}

// Define Interface for Bill Reminder
export interface BillReminder {
  id: number;
  name: string;
  amount: number;
  dueDay: number; // Day of month (1-31)
  categoryId?: number;
  isActive: boolean;
  lastNotified?: string;
}

// Define Interface for Transaction Template
export interface TransactionTemplate {
  id: number;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: number;
  accountId?: number;
  note?: string;
  usageCount: number;
}

// Database Declaration
const db = new Dexie('SpendWiseDB') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>,
  categories: EntityTable<Category, 'id'>,
  recurringTransactions: EntityTable<RecurringTransaction, 'id'>,
  accounts: EntityTable<Account, 'id'>,
  savingsGoals: EntityTable<SavingsGoal, 'id'>,
  billReminders: EntityTable<BillReminder, 'id'>,
  transactionTemplates: EntityTable<TransactionTemplate, 'id'>,
  tags: EntityTable<TagDefinition, 'id'>,
  accountTransfers: EntityTable<AccountTransfer, 'id'>,
  ledger: EntityTable<LedgerItem, 'id'>
};

// Schema versions
db.version(1).stores({
  transactions: '++id, type, categoryId, date',
  categories: '++id, name, type'
});

db.version(2).stores({
  transactions: '++id, type, categoryId, date',
  categories: '++id, name, type'
});

db.version(3).stores({
  transactions: '++id, type, categoryId, date',
  categories: '++id, name, type',
  recurringTransactions: '++id, type, categoryId, frequency, isActive'
});

db.version(4).stores({
  transactions: '++id, type, categoryId, accountId, date',
  categories: '++id, name, type',
  recurringTransactions: '++id, type, categoryId, frequency, isActive',
  accounts: '++id, name, type, isDefault'
});

// Version 5: Added tags (stored as JSON, no index needed)
db.version(5).stores({
  transactions: '++id, type, categoryId, accountId, date',
  categories: '++id, name, type',
  recurringTransactions: '++id, type, categoryId, frequency, isActive',
  accounts: '++id, name, type, isDefault'
});

// Version 6: Added Savings Goals and Bill Reminders
db.version(6).stores({
  transactions: '++id, type, categoryId, accountId, date',
  categories: '++id, name, type',
  recurringTransactions: '++id, type, categoryId, frequency, isActive',
  accounts: '++id, name, type, isDefault',
  savingsGoals: '++id, name',
  billReminders: '++id, name, dueDay, isActive'
});

// Version 7: Added Transaction Templates
db.version(7).stores({
  transactions: '++id, type, categoryId, accountId, date',
  categories: '++id, name, type',
  recurringTransactions: '++id, type, categoryId, frequency, isActive',
  accounts: '++id, name, type, isDefault',
  savingsGoals: '++id, name',
  billReminders: '++id, name, dueDay, isActive',
  transactionTemplates: '++id, name, usageCount'
});

// Version 8: Added Tags table (separate from transactions)
export interface TagDefinition {
  id?: number;
  name: string;
  color?: string;
  createdAt: number;
}

db.version(8).stores({
  transactions: '++id, type, categoryId, accountId, date',
  categories: '++id, name, type',
  recurringTransactions: '++id, type, categoryId, frequency, isActive',
  accounts: '++id, name, type, isDefault',
  savingsGoals: '++id, name',
  billReminders: '++id, name, dueDay, isActive',
  transactionTemplates: '++id, name, usageCount',
  tags: '++id, &name'
});

// Version 9: Added Account Transfers (separate from transactions)
export interface AccountTransfer {
  id?: number;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  date: string;
  note?: string;
  createdAt: number;
}

db.version(9).stores({
  transactions: '++id, type, categoryId, accountId, date',
  categories: '++id, name, type',
  recurringTransactions: '++id, type, categoryId, frequency, isActive',
  accounts: '++id, name, type, isDefault',
  savingsGoals: '++id, name',
  billReminders: '++id, name, dueDay, isActive',
  transactionTemplates: '++id, name, usageCount',
  tags: '++id, &name',
  accountTransfers: '++id, fromAccountId, toAccountId, date'
});

// Version 10: Added Ledger for loans/debts tracking
export interface LedgerItem {
  id?: number;
  type: 'receivable' | 'payable';  // receivable = someone owes you, payable = you owe someone
  personName: string;
  amount: number;
  note?: string;
  dueDate?: string;
  isPaid: boolean;
  paidAt?: number;
  createdAt: number;
}

db.version(10).stores({
  transactions: '++id, type, categoryId, accountId, date',
  categories: '++id, name, type',
  recurringTransactions: '++id, type, categoryId, frequency, isActive',
  accounts: '++id, name, type, isDefault',
  savingsGoals: '++id, name',
  billReminders: '++id, name, dueDay, isActive',
  transactionTemplates: '++id, name, usageCount',
  tags: '++id, &name',
  accountTransfers: '++id, fromAccountId, toAccountId, date',
  ledger: '++id, type, personName, isPaid, dueDate, createdAt'
});

export { db };
