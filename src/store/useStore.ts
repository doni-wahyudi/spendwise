import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, type Transaction, type Category } from '../db/db';
import { type FilterType, getDateRange, type DateRange } from '../utils/dateUtils';
import { type Language } from '../i18n/translations';

interface SearchFilter {
    searchText: string;
    categoryId: number | null;
    type: 'all' | 'income' | 'expense';
    tag: string | null;
}

interface AppState {
    activeTab: 'dashboard' | 'accounts' | 'records' | 'settings' | 'ledger';
    setActiveTab: (tab: 'dashboard' | 'accounts' | 'records' | 'settings' | 'ledger') => void;

    // Date filter state
    dateFilterType: FilterType;
    dateRange: DateRange;
    setDateFilter: (filterType: FilterType, customStart?: string, customEnd?: string) => void;

    // Search filter state
    searchFilter: SearchFilter;
    setSearchFilter: (filter: Partial<SearchFilter>) => void;
    clearSearchFilter: () => void;

    // Theme state
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;

    // Language state
    language: Language;
    setLanguage: (lang: Language) => void;

    // Edit state
    editingTransaction: Transaction | null;
    setEditingTransaction: (tx: Transaction | null) => void;

    // Salary Period
    salaryDay: number;
    setSalaryDay: (day: number) => void;

    // Auto-Backup
    autoBackupEnabled: boolean;
    autoBackupTime: string; // HH:MM format
    setAutoBackupEnabled: (enabled: boolean) => void;
    setAutoBackupTime: (time: string) => void;

    // AI Receipt Scanner
    aiProvider: 'openai' | 'gemini';
    aiApiKey: string;
    aiModel: string;
    openaiBaseUrl: string; // Custom base URL for OpenAI-compatible APIs
    cachedModels: {
        openai: { id: string; name: string }[];
        gemini: { id: string; name: string }[];
    };
    setAiProvider: (provider: 'openai' | 'gemini') => void;
    setAiApiKey: (key: string) => void;
    setAiModel: (model: string) => void;
    setOpenaiBaseUrl: (url: string) => void;
    setCachedModels: (provider: 'openai' | 'gemini', models: { id: string; name: string }[]) => void;

    // Actions
    addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
    updateTransaction: (id: number, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
    deleteTransaction: (id: number) => Promise<void>;
    addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
}

const initialRange = getDateRange('salary', undefined, undefined, 1); // Default to salary period with day 1
const initialSearchFilter: SearchFilter = {
    searchText: '',
    categoryId: null,
    type: 'all',
    tag: null
};

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            activeTab: 'dashboard',
            setActiveTab: (tab) => set({ activeTab: tab }),

            // Date filter - default to salary period
            dateFilterType: 'salary',
            dateRange: initialRange,
            setDateFilter: (filterType, customStart, customEnd) => {
                // For salary period, use salaryDay from state
                const salaryDay = get().salaryDay;
                const range = getDateRange(filterType, customStart, customEnd, salaryDay);
                set({ dateFilterType: filterType, dateRange: range });
            },

            // Search filter
            searchFilter: initialSearchFilter,
            setSearchFilter: (filter) => set((state) => ({
                searchFilter: { ...state.searchFilter, ...filter }
            })),
            clearSearchFilter: () => set({ searchFilter: initialSearchFilter }),

            // Theme
            theme: 'dark',
            setTheme: (theme) => set({ theme }),

            // Language
            language: 'id',
            setLanguage: (language) => set({ language }),

            editingTransaction: null,
            setEditingTransaction: (tx) => set({ editingTransaction: tx }),

            // Salary Period
            salaryDay: 1,
            setSalaryDay: (day) => set({ salaryDay: day }),

            // Auto-Backup
            autoBackupEnabled: false,
            autoBackupTime: '02:00',
            setAutoBackupEnabled: (enabled) => set({ autoBackupEnabled: enabled }),
            setAutoBackupTime: (time) => set({ autoBackupTime: time }),

            // AI Receipt Scanner
            aiProvider: 'gemini',
            aiApiKey: '',
            aiModel: 'gemini-3-flash',
            openaiBaseUrl: 'https://api.openai.com/v1',
            cachedModels: { openai: [], gemini: [] },
            setAiProvider: (provider) => set({
                aiProvider: provider,
                // Reset to default model for the provider
                aiModel: provider === 'gemini' ? 'gemini-3-flash' : 'gpt-5'
            }),
            setAiApiKey: (key) => set({ aiApiKey: key }),
            setAiModel: (model) => set({ aiModel: model }),
            setOpenaiBaseUrl: (url) => set({ openaiBaseUrl: url }),
            setCachedModels: (provider, models) => set((state) => ({
                cachedModels: { ...state.cachedModels, [provider]: models }
            })),

            addTransaction: async (tx) => {
                await db.transactions.add({
                    ...tx,
                    createdAt: Date.now(),
                });
            },

            updateTransaction: async (id, updates) => {
                await db.transactions.update(id, updates);
                set({ editingTransaction: null });
            },

            deleteTransaction: async (id) => {
                await db.transactions.delete(id);
            },

            addCategory: async (cat) => {
                await db.categories.add(cat);
            },
        }),
        {
            name: 'spendwise-storage',
            partialize: (state) => ({
                theme: state.theme,
                language: state.language,
                salaryDay: state.salaryDay,
                autoBackupEnabled: state.autoBackupEnabled,
                autoBackupTime: state.autoBackupTime,
                aiProvider: state.aiProvider,
                aiApiKey: state.aiApiKey,
                aiModel: state.aiModel,
                openaiBaseUrl: state.openaiBaseUrl,
                cachedModels: state.cachedModels
            }),
        }
    )
);
