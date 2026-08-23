// i18n translations for SpendWise — comprehensive bilingual coverage
export type Language = 'id' | 'en';

interface Translations {
    // ── Navigation ──
    dashboard: string; transactions: string; settings: string;
    records: string; ledger: string; accounts: string; reports: string;
    // ── Period labels ──
    allTime: string; thisMonth: string; lastMonth: string; customPeriod: string;
    daily: string; weekly: string; monthly: string; yearly: string;
    today: string; startDate: string; endDate: string; apply: string;
    // ── Summary cards ──
    income: string; expense: string; balance: string; totalBalance: string;
    recentTransactions: string; heavySpot: string; spendingBreakdown: string;
    incomeVsExpense: string; balanceTrend: string; budgetProgress: string;
    spentSoFar: string; projectedTotal: string; budget: string;
    total: string; peak: string; less: string; more: string;
    // ── Transaction form ──
    addTransaction: string; updateTransaction: string; editTransaction: string;
    editingTransactionBanner: string; cancel: string; amount: string;
    category: string; account: string; date: string; note: string;
    noteOptional: string; addTags: string; selectCategory: string;
    selectAccount: string; amountError: string; categoryError: string;
    scanReceipt: string; configureApiKey: string; failedToScan: string;
    transactionAdded: string; transactionUpdated: string;
    deleteTransactionConfirm: string; noTransactions: string;
    noTransactionsInPeriod: string; addFirstTransaction: string; duplicate: string;
    // ── Settings tabs ──
    appearance: string; features: string; data: string; categories: string;
    theme: string; light: string; dark: string; language: string;
    hapticFeedback: string; vibrationOnTouch: string;
    // ── Settings – Data tab ──
    exportData: string; exportDataDesc: string; exportJSON: string; exportCSV: string;
    importData: string; importJSON: string; importCSV: string;
    sampleData: string; sampleDataDesc: string;
    addSampleTransactions: string; addSampleAccounts: string; sampleAdded: string;
    clearAllData: string; clearDataDesc: string; dangerZone: string;
    clearConfirm: string; deleteConfirm: string;
    importSuccess: string; exportSuccess: string; dataCleared: string; noData: string;
    // ── Categories ──
    categoryName: string; editCategory: string; type: string; color: string;
    expenseCategories: string; incomeCategories: string; defaultBadge: string;
    save: string; add: string; edit: string; delete: string; confirm: string;
    // ── Accounts ──
    accountName: string; initialBalance: string; setNewBalance: string;
    adjustBalance: string; editAccount: string;
    transferAmount: string; transferNote: string; fromAccount: string;
    toAccount: string; transferHistory: string; setAsDefault: string;
    bank: string; cash: string; ewallet: string; investment: string; other: string;
    accountActivity: string; accountTransactions: string; totalSpent: string;
    totalReceived: string; netTransfers: string; noAccountTransactions: string;
    viewTransactions: string; allAccounts: string; spendingByCategory: string;
    selectAccountToView: string; transfersCount: string; inflow: string;
    outflow: string; accountDetails: string;
    // ── Search / Filter ──
    searchPlaceholder: string; clearFilters: string;
    allCategories: string; allTags: string; allTypes: string;
    // ── Date filter ──
    salary: string;
    // ── Records view ──
    deleteThisTransaction: string;
    // ── Savings Goals ──
    savingsGoals: string; goalName: string; targetAmount: string;
    currentSaved: string; deadline: string; addFunds: string;
    amountToAdd: string; overall: string;
    // ── Bill Reminders ──
    billReminders: string; billName: string; noCategory: string;
    // ── Quick Templates ──
    quickTemplates: string; templateName: string; saveTemplate: string; defaultAccount: string;
    // ── Recurring ──
    recurringTransactions: string; addRecurring: string;
    freq_daily: string; freq_weekly: string; freq_monthly: string; freq_yearly: string;
    // ── Split Transaction ──
    splitTransaction: string; totalAmount: string;
    // ── Ledger ──
    paid: string; unpaid: string; personOrCompany: string;
    markAsPaid: string; markAsUnpaid: string; ledgerNote: string;
    toReceive: string; toPay: string; receivable: string; payable: string;
    receivables: string; payables: string; addReceivable: string; addPayable: string;
    recordPayment: string; paymentHistory: string; remaining: string;
    paidSoFar: string; partialPaid: string; recordInTransactions: string;
    disburseFromAccount: string; receiveIntoAccount: string; payFull: string;
    noPaymentsYet: string; paymentAdded: string; paymentDeleted: string;
    deletePaymentConfirm: string; activeLedger: string; allLedger: string;
    settledLedger: string; sourceAccount: string; paymentAmount: string;
    paymentAmountError: string;
    // ── Reports (Settings > Data) ──
    totalIncome: string; totalExpense: string; netBalance: string; topExpenses: string;
    // ── Reports View ──
    financialReport: string; monthlyReport: string; customRangeReport: string;
    customRange: string; summaryOverview: string; categoryBreakdown: string;
    itemBreakdown: string; savingsRate: string; dailyAverage: string;
    peakSpendingDay: string; vsPreviousPeriod: string; itemsList: string;
    topItems: string; allTransactions: string; exportReport: string;
    copySummary: string; copiedToClipboard: string; printReport: string;
    noDataInPeriod: string; expenseBreakdown: string; incomeBreakdown: string;
    salaryCycle: string; selectMonth: string; viewFullReport: string;
    viewFullReportDesc: string; openReport: string;
    totalInflow: string; totalOutflow: string; netSavings: string; itemsCount: string;
    cashFlowAllocation: string; filterCategoryOrItem: string;
    expandAll: string; collapseAll: string; previous: string; next: string;
    // ── Misc ──
    recurringLabel: string;
}

const translations: Record<Language, Translations> = {
    id: {
        dashboard: 'Dasbor', transactions: 'Transaksi', settings: 'Pengaturan',
        records: 'Catatan', ledger: 'Buku Besar', accounts: 'Akun', reports: 'Laporan',
        allTime: 'Semua Waktu', thisMonth: 'Bulan Ini', lastMonth: 'Bulan Lalu',
        customPeriod: 'Periode Kustom', daily: 'Harian', weekly: 'Mingguan',
        monthly: 'Bulanan', yearly: 'Tahunan', today: 'Hari Ini',
        startDate: 'Tanggal Mulai', endDate: 'Tanggal Akhir', apply: 'Terapkan',
        income: 'Pemasukan', expense: 'Pengeluaran', balance: 'Saldo',
        totalBalance: 'Total Saldo', recentTransactions: 'Transaksi Terbaru',
        heavySpot: 'Pengeluaran terbesar di', spendingBreakdown: 'Rincian Pengeluaran',
        incomeVsExpense: 'Pemasukan vs Pengeluaran', balanceTrend: 'Tren Saldo',
        budgetProgress: 'Progress Anggaran', spentSoFar: 'Sudah Dibelanjakan',
        projectedTotal: 'Proyeksi Total', budget: 'Anggaran', total: 'Total',
        peak: 'Puncak', less: 'Sedikit', more: 'Banyak',
        addTransaction: 'Tambah Transaksi', updateTransaction: 'Perbarui Transaksi',
        editTransaction: 'Edit Transaksi', editingTransactionBanner: 'Mengedit Transaksi',
        cancel: 'Batal', amount: 'Jumlah', category: 'Kategori', account: 'Akun',
        date: 'Tanggal', note: 'Catatan', noteOptional: 'Catatan (Opsional)',
        addTags: 'Tambah tag...', selectCategory: 'Pilih Kategori',
        selectAccount: 'Pilih akun', amountError: 'Jumlah harus lebih dari 0',
        categoryError: 'Pilih kategori', scanReceipt: 'Pindai Struk',
        configureApiKey: 'Harap atur API key di Pengaturan',
        failedToScan: 'Gagal memindai struk',
        transactionAdded: 'Transaksi berhasil ditambahkan!',
        transactionUpdated: 'Transaksi berhasil diperbarui!',
        deleteTransactionConfirm: 'Yakin ingin menghapus transaksi ini?',
        noTransactions: 'Belum ada transaksi.',
        noTransactionsInPeriod: 'Tidak ada transaksi di periode ini.',
        addFirstTransaction: '+ Tambah Transaksi Pertama', duplicate: 'Duplikat',
        appearance: 'Tampilan', features: 'Fitur', data: 'Data',
        categories: 'Kategori', theme: 'Tema', light: 'Terang', dark: 'Gelap',
        language: 'Bahasa', hapticFeedback: 'Umpan Balik Haptik',
        vibrationOnTouch: 'Getaran saat sentuh',
        exportData: 'Ekspor Data', exportDataDesc: 'Unduh semua transaksi dan kategori Anda.',
        exportJSON: 'Ekspor JSON', exportCSV: 'Ekspor CSV',
        importData: 'Impor Data', importJSON: 'Impor JSON', importCSV: 'Impor CSV',
        sampleData: 'Data Contoh',
        sampleDataDesc: 'Buat data contoh untuk pengujian (ditambahkan ke data yang ada).',
        addSampleTransactions: '+ Tambah Transaksi Contoh',
        addSampleAccounts: '+ Tambah Akun Contoh', sampleAdded: 'Data contoh ditambahkan!',
        clearAllData: 'Hapus Semua Data', clearDataDesc: 'Hapus semua data Anda secara permanen.',
        dangerZone: 'Zona Bahaya', clearConfirm: 'Yakin ingin menghapus semua data?',
        deleteConfirm: 'Yakin ingin menghapus ini?',
        importSuccess: 'Berhasil mengimpor data', exportSuccess: 'Berhasil mengekspor data',
        dataCleared: 'Semua data telah dihapus', noData: 'Tidak ada data.',
        categoryName: 'Nama Kategori', editCategory: 'Edit Kategori',
        type: 'Tipe', color: 'Warna',
        expenseCategories: 'Kategori Pengeluaran', incomeCategories: 'Kategori Pemasukan',
        defaultBadge: 'Bawaan', save: 'Simpan', add: 'Tambah',
        edit: 'Edit', delete: 'Hapus', confirm: 'Konfirmasi',
        accountName: 'Nama Akun', initialBalance: 'Saldo awal (opsional)',
        setNewBalance: 'Atur saldo baru (kosongkan untuk tetap)',
        adjustBalance: 'Sesuaikan Saldo Akun', editAccount: 'Edit Akun',
        transferAmount: 'Jumlah transfer', transferNote: 'mis. Tabungan bulanan',
        fromAccount: 'Dari Akun', toAccount: 'Ke Akun',
        transferHistory: 'Riwayat Transfer', setAsDefault: 'Jadikan utama',
        bank: 'Bank', cash: 'Tunai', ewallet: 'E-Wallet', investment: 'Investasi', other: 'Lainnya',
        accountActivity: 'Aktivitas & Pengeluaran Akun',
        accountTransactions: 'Daftar Transaksi Akun',
        totalSpent: 'Total Pengeluaran', totalReceived: 'Total Pemasukan',
        netTransfers: 'Transfer Bersih',
        noAccountTransactions: 'Belum ada transaksi pada akun ini.',
        viewTransactions: 'Lihat Transaksi', allAccounts: 'Semua Akun',
        spendingByCategory: 'Pengeluaran per Kategori',
        selectAccountToView: 'Pilih akun di atas untuk melihat rincian pengeluaran',
        transfersCount: 'Transfer', inflow: 'Masuk', outflow: 'Keluar',
        accountDetails: 'Detail Akun',
        searchPlaceholder: 'Cari catatan, kategori, tag, jumlah...',
        clearFilters: 'Hapus filter', allCategories: 'Semua Kategori',
        allTags: 'Semua Tag', allTypes: 'Semua Tipe',
        salary: 'Gaji',
        deleteThisTransaction: 'Hapus transaksi ini?',
        savingsGoals: 'Target Tabungan', goalName: 'Nama target (mis. Liburan)',
        targetAmount: 'Jumlah target', currentSaved: 'Sudah ditabung',
        deadline: 'Batas waktu (opsional)', addFunds: 'Tambah dana',
        amountToAdd: 'Jumlah yang ditambahkan', overall: 'Keseluruhan',
        billReminders: 'Pengingat Tagihan', billName: 'Nama tagihan (mis. Netflix)',
        noCategory: 'Tanpa kategori',
        quickTemplates: 'Template Cepat', templateName: 'Nama template (mis. Kopi)',
        saveTemplate: 'Simpan Template', defaultAccount: 'Akun bawaan',
        recurringTransactions: 'Transaksi Berulang', addRecurring: 'Tambah Berulang',
        freq_daily: 'Harian', freq_weekly: 'Mingguan',
        freq_monthly: 'Bulanan', freq_yearly: 'Tahunan',
        splitTransaction: 'Bagi Transaksi', totalAmount: 'Jumlah Total',
        paid: 'Lunas', unpaid: 'Belum Lunas',
        personOrCompany: 'Nama orang atau perusahaan',
        markAsPaid: 'Tandai lunas', markAsUnpaid: 'Tandai belum lunas',
        ledgerNote: 'mis. Makan malam minggu lalu',
        toReceive: 'Piutang', toPay: 'Hutang', receivable: 'Piutang', payable: 'Hutang',
        receivables: 'Daftar Piutang', payables: 'Daftar Hutang',
        addReceivable: '+ Tambah Piutang', addPayable: '+ Tambah Hutang',
        recordPayment: 'Catat Pembayaran', paymentHistory: 'Riwayat Pembayaran',
        remaining: 'Sisa', paidSoFar: 'Sudah Dibayar', partialPaid: 'Sebagian',
        recordInTransactions: 'Catat ke transaksi & perbarui saldo akun',
        disburseFromAccount: 'Potong dari saldo akun (pengeluaran pinjaman)',
        receiveIntoAccount: 'Tambah ke saldo akun (pemasukan pinjaman)',
        payFull: 'Lunasi Sisa', noPaymentsYet: 'Belum ada pembayaran dicatat.',
        paymentAdded: 'Pembayaran berhasil dicatat!', paymentDeleted: 'Pembayaran dihapus!',
        deletePaymentConfirm: 'Yakin ingin menghapus catatan pembayaran ini?',
        activeLedger: 'Belum Lunas & Sebagian', allLedger: 'Semua',
        settledLedger: 'Sudah Lunas', sourceAccount: 'Pilih Akun Terkait',
        paymentAmount: 'Jumlah Pembayaran',
        paymentAmountError: 'Jumlah pembayaran harus lebih dari 0 dan tidak melebihi sisa hutang.',
        totalIncome: 'Total Pemasukan', totalExpense: 'Total Pengeluaran',
        netBalance: 'Saldo Bersih', topExpenses: 'Pengeluaran Terbesar',
        financialReport: 'Laporan Keuangan', monthlyReport: 'Laporan Bulanan',
        customRangeReport: 'Laporan Rentang Kustom', customRange: 'Rentang Kustom',
        summaryOverview: 'Ringkasan Eksekutif', categoryBreakdown: 'Rincian Kategori',
        itemBreakdown: 'Rincian Item & Transaksi', savingsRate: 'Tingkat Tabungan',
        dailyAverage: 'Rata-rata Harian', peakSpendingDay: 'Hari Pengeluaran Tertinggi',
        vsPreviousPeriod: 'vs Periode Sebelumnya', itemsList: 'Daftar Item',
        topItems: 'Item Sering Dibeli', allTransactions: 'Semua Transaksi',
        exportReport: 'Ekspor Laporan', copySummary: 'Salin Ringkasan',
        copiedToClipboard: 'Ringkasan berhasil disalin!',
        printReport: 'Cetak / Simpan PDF',
        noDataInPeriod: 'Tidak ada data transaksi pada periode ini.',
        expenseBreakdown: 'Rincian Pengeluaran', incomeBreakdown: 'Rincian Pemasukan',
        salaryCycle: 'Siklus Gaji', selectMonth: 'Pilih Bulan',
        viewFullReport: 'Lihat Laporan Lengkap',
        viewFullReportDesc: 'Rincian bulanan & rentang kustom dengan detail kategori',
        openReport: 'Buka Laporan →',
        totalInflow: 'Total Arus Masuk', totalOutflow: 'Total Arus Keluar',
        netSavings: 'Tabungan Bersih', itemsCount: 'Item',
        cashFlowAllocation: 'Alokasi Arus Kas',
        filterCategoryOrItem: 'Filter kategori atau item...',
        expandAll: 'Buka Semua', collapseAll: 'Tutup Semua',
        previous: 'Sebelumnya', next: 'Berikutnya',
        recurringLabel: 'Berulang',
    },

    en: {
        dashboard: 'Dashboard', transactions: 'Transactions', settings: 'Settings',
        records: 'Records', ledger: 'Ledger', accounts: 'Accounts', reports: 'Reports',
        allTime: 'All Time', thisMonth: 'This Month', lastMonth: 'Last Month',
        customPeriod: 'Custom Period', daily: 'Daily', weekly: 'Weekly',
        monthly: 'Monthly', yearly: 'Yearly', today: 'Today',
        startDate: 'Start Date', endDate: 'End Date', apply: 'Apply',
        income: 'Income', expense: 'Expense', balance: 'Balance',
        totalBalance: 'Total Balance', recentTransactions: 'Recent Transactions',
        heavySpot: 'Heavy spot in', spendingBreakdown: 'Spending Breakdown',
        incomeVsExpense: 'Income vs Expense', balanceTrend: 'Balance Trend',
        budgetProgress: 'Budget Progress', spentSoFar: 'Spent So Far',
        projectedTotal: 'Projected Total', budget: 'Budget', total: 'Total',
        peak: 'Peak', less: 'Less', more: 'More',
        addTransaction: 'Add Transaction', updateTransaction: 'Update Transaction',
        editTransaction: 'Edit Transaction', editingTransactionBanner: 'Editing Transaction',
        cancel: 'Cancel', amount: 'Amount', category: 'Category', account: 'Account',
        date: 'Date', note: 'Note', noteOptional: 'Note (Optional)',
        addTags: 'Add tags...', selectCategory: 'Select Category',
        selectAccount: 'Select account', amountError: 'Amount must be greater than 0',
        categoryError: 'Please select a category', scanReceipt: 'Scan Receipt',
        configureApiKey: 'Please configure API key in Settings',
        failedToScan: 'Failed to scan receipt',
        transactionAdded: 'Transaction added!', transactionUpdated: 'Transaction updated!',
        deleteTransactionConfirm: 'Are you sure you want to delete this transaction?',
        noTransactions: 'No transactions found.',
        noTransactionsInPeriod: 'No transactions in this period.',
        addFirstTransaction: '+ Add Your First Transaction', duplicate: 'Duplicate',
        appearance: 'Appearance', features: 'Features', data: 'Data',
        categories: 'Categories', theme: 'Theme', light: 'Light', dark: 'Dark',
        language: 'Language', hapticFeedback: 'Haptic Feedback',
        vibrationOnTouch: 'Vibration on touch actions',
        exportData: 'Export Data', exportDataDesc: 'Download all your transactions and categories.',
        exportJSON: 'Export JSON', exportCSV: 'Export CSV',
        importData: 'Import Data', importJSON: 'Import JSON', importCSV: 'Import CSV',
        sampleData: 'Sample Data',
        sampleDataDesc: 'Generate sample data for testing (will add to existing data).',
        addSampleTransactions: '+ Add Sample Transactions',
        addSampleAccounts: '+ Add Sample Accounts', sampleAdded: 'Sample data added!',
        clearAllData: 'Clear All Data', clearDataDesc: 'Permanently delete all your data.',
        dangerZone: 'Danger Zone', clearConfirm: 'Are you sure you want to clear all data?',
        deleteConfirm: 'Are you sure you want to delete this?',
        importSuccess: 'Data imported successfully', exportSuccess: 'Data exported successfully',
        dataCleared: 'All data has been cleared', noData: 'No data available.',
        categoryName: 'Category name', editCategory: 'Edit Category',
        type: 'Type', color: 'Color',
        expenseCategories: 'Expense Categories', incomeCategories: 'Income Categories',
        defaultBadge: 'Default', save: 'Save', add: 'Add',
        edit: 'Edit', delete: 'Delete', confirm: 'Confirm',
        accountName: 'Account name', initialBalance: 'Initial balance (optional)',
        setNewBalance: 'Set new balance (leave empty to keep)',
        adjustBalance: 'Adjust Account Balance', editAccount: 'Edit Account',
        transferAmount: 'Transfer amount', transferNote: 'e.g., Monthly savings',
        fromAccount: 'From Account', toAccount: 'To Account',
        transferHistory: 'Transfer History', setAsDefault: 'Set as default',
        bank: 'Bank', cash: 'Cash', ewallet: 'E-Wallet', investment: 'Investment', other: 'Other',
        accountActivity: 'Account Activity & Spending',
        accountTransactions: 'Account Transactions',
        totalSpent: 'Total Spent', totalReceived: 'Total Received',
        netTransfers: 'Net Transfers',
        noAccountTransactions: 'No transactions recorded on this account yet.',
        viewTransactions: 'View Transactions', allAccounts: 'All Accounts',
        spendingByCategory: 'Spending by Category',
        selectAccountToView: 'Select an account above to view spending details',
        transfersCount: 'Transfers', inflow: 'Inflow', outflow: 'Outflow',
        accountDetails: 'Account Details',
        searchPlaceholder: 'Search note, category, tag, amount...',
        clearFilters: 'Clear filters', allCategories: 'All Categories',
        allTags: 'All Tags', allTypes: 'All Types',
        salary: 'Salary',
        deleteThisTransaction: 'Delete this transaction?',
        savingsGoals: 'Savings Goals', goalName: 'Goal name (e.g., Vacation)',
        targetAmount: 'Target amount', currentSaved: 'Current saved',
        deadline: 'Deadline (optional)', addFunds: 'Add funds',
        amountToAdd: 'Amount to add', overall: 'Overall',
        billReminders: 'Bill Reminders', billName: 'Bill name (e.g., Netflix)',
        noCategory: 'No category',
        quickTemplates: 'Quick Templates', templateName: 'Template name (e.g., Coffee)',
        saveTemplate: 'Save Template', defaultAccount: 'Default account',
        recurringTransactions: 'Recurring Transactions', addRecurring: 'Add Recurring',
        freq_daily: 'Daily', freq_weekly: 'Weekly',
        freq_monthly: 'Monthly', freq_yearly: 'Yearly',
        splitTransaction: 'Split Transaction', totalAmount: 'Total Amount',
        paid: 'Paid', unpaid: 'Unpaid',
        personOrCompany: 'Person or company name',
        markAsPaid: 'Mark as paid', markAsUnpaid: 'Mark as unpaid',
        ledgerNote: 'e.g., For dinner last week',
        toReceive: 'To Receive', toPay: 'To Pay', receivable: 'Receivable', payable: 'Payable',
        receivables: 'Receivables', payables: 'Payables',
        addReceivable: '+ Add Receivable', addPayable: '+ Add Payable',
        recordPayment: 'Record Payment', paymentHistory: 'Payment History',
        remaining: 'Remaining', paidSoFar: 'Paid So Far', partialPaid: 'Partial',
        recordInTransactions: 'Record in transactions & update account balance',
        disburseFromAccount: 'Deduct from account balance (loan disbursement)',
        receiveIntoAccount: 'Add to account balance (loan receipt)',
        payFull: 'Pay Full Remaining', noPaymentsYet: 'No payments recorded yet.',
        paymentAdded: 'Payment recorded successfully!', paymentDeleted: 'Payment deleted!',
        deletePaymentConfirm: 'Are you sure you want to delete this payment?',
        activeLedger: 'Active & Partial', allLedger: 'All',
        settledLedger: 'Fully Settled', sourceAccount: 'Select Linked Account',
        paymentAmount: 'Payment Amount',
        paymentAmountError: 'Payment amount must be greater than 0 and cannot exceed the remaining balance.',
        totalIncome: 'Total Income', totalExpense: 'Total Expense',
        netBalance: 'Net Balance', topExpenses: 'Top Expenses',
        financialReport: 'Financial Report', monthlyReport: 'Monthly Report',
        customRangeReport: 'Custom Range Report', customRange: 'Custom Range',
        summaryOverview: 'Executive Summary', categoryBreakdown: 'Category Breakdown',
        itemBreakdown: 'Item & Transaction Breakdown', savingsRate: 'Savings Rate',
        dailyAverage: 'Daily Average', peakSpendingDay: 'Peak Spending Day',
        vsPreviousPeriod: 'vs Previous Period', itemsList: 'Items List',
        topItems: 'Frequent Items', allTransactions: 'All Transactions',
        exportReport: 'Export Report', copySummary: 'Copy Summary',
        copiedToClipboard: 'Summary copied to clipboard!',
        printReport: 'Print / Save PDF',
        noDataInPeriod: 'No transaction data in this period.',
        expenseBreakdown: 'Expense Breakdown', incomeBreakdown: 'Income Breakdown',
        salaryCycle: 'Salary Cycle', selectMonth: 'Select Month',
        viewFullReport: 'View Full Financial Report',
        viewFullReportDesc: 'Monthly & custom date range breakdown with itemized category details',
        openReport: 'Open Report →',
        totalInflow: 'Total Inflow', totalOutflow: 'Total Outflow',
        netSavings: 'Net Savings', itemsCount: 'Items',
        cashFlowAllocation: 'Cash Flow Allocation',
        filterCategoryOrItem: 'Filter category or item...',
        expandAll: 'Expand All', collapseAll: 'Collapse All',
        previous: 'Previous', next: 'Next',
        recurringLabel: 'Recurring',
    }
};

export function getTranslations(lang: Language): Translations {
    return translations[lang];
}

export const t = (lang: Language, key: keyof Translations): string => {
    return translations[lang][key];
};

export default translations;
