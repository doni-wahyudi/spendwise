// i18n translations for SpendWise
export type Language = 'id' | 'en';

interface Translations {
    // Navigation
    dashboard: string;
    transactions: string;
    settings: string;

    // Dashboard
    income: string;
    expense: string;
    balance: string;
    recentTransactions: string;
    heavySpot: string;
    allTime: string;
    thisMonth: string;
    lastMonth: string;
    customPeriod: string;

    // Transaction Form
    addTransaction: string;
    updateTransaction: string;
    editTransaction: string;
    cancel: string;
    amount: string;
    category: string;
    account: string;
    date: string;
    note: string;
    addTags: string;
    selectCategory: string;
    amountError: string;
    categoryError: string;

    // Settings
    exportData: string;
    importData: string;
    exportJSON: string;
    exportCSV: string;
    importJSON: string;
    importCSV: string;
    clearAllData: string;
    dangerZone: string;
    appearance: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    categories: string;
    accounts: string;
    recurringTransactions: string;
    reports: string;

    // Actions
    add: string;
    edit: string;
    delete: string;
    save: string;
    confirm: string;
    clearConfirm: string;
    deleteConfirm: string;

    // Messages
    noTransactions: string;
    noData: string;
    importSuccess: string;
    exportSuccess: string;
    dataCleared: string;
}

const translations: Record<Language, Translations> = {
    id: {
        // Navigation
        dashboard: 'Dasbor',
        transactions: 'Transaksi',
        settings: 'Pengaturan',

        // Dashboard
        income: 'Pemasukan',
        expense: 'Pengeluaran',
        balance: 'Saldo',
        recentTransactions: 'Transaksi Terbaru',
        heavySpot: 'Pengeluaran terbesar di',
        allTime: 'Semua Waktu',
        thisMonth: 'Bulan Ini',
        lastMonth: 'Bulan Lalu',
        customPeriod: 'Periode Kustom',

        // Transaction Form
        addTransaction: 'Tambah Transaksi',
        updateTransaction: 'Perbarui Transaksi',
        editTransaction: 'Edit Transaksi',
        cancel: 'Batal',
        amount: 'Jumlah',
        category: 'Kategori',
        account: 'Akun',
        date: 'Tanggal',
        note: 'Catatan',
        addTags: 'Tambah tag...',
        selectCategory: 'Pilih Kategori',
        amountError: 'Jumlah harus lebih dari 0',
        categoryError: 'Pilih kategori',

        // Settings
        exportData: 'Ekspor Data',
        importData: 'Impor Data',
        exportJSON: 'Ekspor JSON',
        exportCSV: 'Ekspor CSV',
        importJSON: 'Impor JSON',
        importCSV: 'Impor CSV',
        clearAllData: 'Hapus Semua Data',
        dangerZone: 'Zona Bahaya',
        appearance: 'Tampilan',
        language: 'Bahasa',
        theme: 'Tema',
        light: 'Terang',
        dark: 'Gelap',
        categories: 'Kategori',
        accounts: 'Akun',
        recurringTransactions: 'Transaksi Berulang',
        reports: 'Laporan',

        // Actions
        add: 'Tambah',
        edit: 'Edit',
        delete: 'Hapus',
        save: 'Simpan',
        confirm: 'Konfirmasi',
        clearConfirm: 'Yakin ingin menghapus semua data?',
        deleteConfirm: 'Yakin ingin menghapus ini?',

        // Messages
        noTransactions: 'Belum ada transaksi.',
        noData: 'Tidak ada data.',
        importSuccess: 'Berhasil mengimpor data',
        exportSuccess: 'Berhasil mengekspor data',
        dataCleared: 'Semua data telah dihapus',
    },
    en: {
        // Navigation
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        settings: 'Settings',

        // Dashboard
        income: 'Income',
        expense: 'Expense',
        balance: 'Balance',
        recentTransactions: 'Recent Transactions',
        heavySpot: 'Heavy spot in',
        allTime: 'All Time',
        thisMonth: 'This Month',
        lastMonth: 'Last Month',
        customPeriod: 'Custom Period',

        // Transaction Form
        addTransaction: 'Add Transaction',
        updateTransaction: 'Update Transaction',
        editTransaction: 'Editing Transaction',
        cancel: 'Cancel',
        amount: 'Amount',
        category: 'Category',
        account: 'Account',
        date: 'Date',
        note: 'Note',
        addTags: 'Add tags...',
        selectCategory: 'Select Category',
        amountError: 'Amount must be greater than 0',
        categoryError: 'Please select a category',

        // Settings
        exportData: 'Export Data',
        importData: 'Import Data',
        exportJSON: 'Export JSON',
        exportCSV: 'Export CSV',
        importJSON: 'Import JSON',
        importCSV: 'Import CSV',
        clearAllData: 'Clear All Data',
        dangerZone: 'Danger Zone',
        appearance: 'Appearance',
        language: 'Language',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        categories: 'Categories',
        accounts: 'Accounts',
        recurringTransactions: 'Recurring Transactions',
        reports: 'Reports',

        // Actions
        add: 'Add',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        confirm: 'Confirm',
        clearConfirm: 'Are you sure you want to clear all data?',
        deleteConfirm: 'Are you sure you want to delete this?',

        // Messages
        noTransactions: 'No transactions found.',
        noData: 'No data available.',
        importSuccess: 'Data imported successfully',
        exportSuccess: 'Data exported successfully',
        dataCleared: 'All data has been cleared',
    }
};

export function getTranslations(lang: Language): Translations {
    return translations[lang];
}

export const t = (lang: Language, key: keyof Translations): string => {
    return translations[lang][key];
};

export default translations;
