import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account, type Transaction, type AccountTransfer } from '../db/db';
import { useToast } from '../store/useToast';
import { useStore } from '../store/useStore';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/currency';
import { formatLocalDate } from '../utils/dateUtils';
import {
    Wallet,
    Plus,
    Trash2,
    Edit2,
    ArrowRightLeft,
    Building2,
    Smartphone,
    PiggyBank,
    X,
    Check,
    History,
    TrendingDown,
    TrendingUp,
    Search,
    PieChart,
    Calendar,
    Star,
    Layers,
    Filter
} from 'lucide-react';
import { t } from '../i18n/translations';

const ACCOUNT_ICONS: Record<string, React.ReactNode> = {
    cash: <Wallet size={20} />,
    bank: <Building2 size={20} />,
    ewallet: <Smartphone size={20} />,
    other: <PiggyBank size={20} />
};

const ACCOUNT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f59e0b', '#10b981', '#14b8a6', '#3b82f6'
];

type TxFilterType = 'all' | 'expense' | 'income' | 'transfer';

export default function AccountsView() {
    const { addToast } = useToast();
    const { language, setEditingTransaction } = useStore();

    // Database Live Queries
    const accounts = useLiveQuery(() => db.accounts.toArray());
    const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());
    const transfers = useLiveQuery(() => db.accountTransfers.orderBy('date').reverse().toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    // Selection & filter state
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [txFilter, setTxFilter] = useState<TxFilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Add / Edit Account modal state
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<Account['type']>('bank');
    const [color, setColor] = useState(ACCOUNT_COLORS[0]);
    const [balance, setBalance] = useState('');
    const [adjustBalance, setAdjustBalance] = useState('');

    // Transfer Modal state
    const [showTransfer, setShowTransfer] = useState(false);
    const [fromAccountId, setFromAccountId] = useState<number>(0);
    const [toAccountId, setToAccountId] = useState<number>(0);
    const [transferAmount, setTransferAmount] = useState('');
    const [transferNote, setTransferNote] = useState('');

    // Transfer History modal state
    const [showTransferHistory, setShowTransferHistory] = useState(false);

    // Auto-select first account if none selected
    const activeAccountId = selectedAccountId ?? (accounts && accounts.length > 0 ? accounts[0].id : null);
    const selectedAccount = accounts?.find(a => a.id === activeAccountId);

    // Calculate actual balance, total spent, income, and transfers for each account
    const { accountBalances, accountSpentMap, accountIncomeMap, accountTransferInMap, accountTransferOutMap } = useMemo(() => {
        const balances: Record<number, number> = {};
        const spentMap: Record<number, number> = {};
        const incomeMap: Record<number, number> = {};
        const tfInMap: Record<number, number> = {};
        const tfOutMap: Record<number, number> = {};

        if (accounts) {
            accounts.forEach(acc => {
                balances[acc.id] = acc.manualBalance || 0;
                spentMap[acc.id] = 0;
                incomeMap[acc.id] = 0;
                tfInMap[acc.id] = 0;
                tfOutMap[acc.id] = 0;
            });
        }

        // Apply transactions
        transactions?.forEach(tx => {
            if (tx.accountId && balances[tx.accountId] !== undefined) {
                if (tx.type === 'income') {
                    balances[tx.accountId] += tx.amount;
                    incomeMap[tx.accountId] += tx.amount;
                } else {
                    balances[tx.accountId] -= tx.amount;
                    spentMap[tx.accountId] += tx.amount;
                }
            }
        });

        // Apply transfers
        transfers?.forEach(tf => {
            if (balances[tf.fromAccountId] !== undefined) {
                balances[tf.fromAccountId] -= tf.amount;
                tfOutMap[tf.fromAccountId] += tf.amount;
            }
            if (balances[tf.toAccountId] !== undefined) {
                balances[tf.toAccountId] += tf.amount;
                tfInMap[tf.toAccountId] += tf.amount;
            }
        });

        return {
            accountBalances: balances,
            accountSpentMap: spentMap,
            accountIncomeMap: incomeMap,
            accountTransferInMap: tfInMap,
            accountTransferOutMap: tfOutMap
        };
    }, [transactions, accounts, transfers]);

    const totalBalance = useMemo(() => {
        return Object.values(accountBalances).reduce((sum, bal) => sum + bal, 0);
    }, [accountBalances]);

    const getAccountName = (id: number) => accounts?.find(a => a.id === id)?.name || 'Unknown';
    const getCategory = (id: number) => categories?.find(c => c.id === id);

    // Selected account's category spending distribution
    const accountCategorySpending = useMemo(() => {
        if (!activeAccountId || !transactions || !categories) return [];

        const catTotals: Record<number, number> = {};
        let totalExpense = 0;

        transactions.forEach(tx => {
            if (tx.accountId === activeAccountId && tx.type === 'expense') {
                catTotals[tx.categoryId] = (catTotals[tx.categoryId] || 0) + tx.amount;
                totalExpense += tx.amount;
            }
        });

        return Object.entries(catTotals)
            .map(([catId, amount]) => {
                const cat = categories.find(c => c.id === parseInt(catId));
                const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                return {
                    id: parseInt(catId),
                    name: cat?.name || 'Uncategorized',
                    color: cat?.color || '#6366f1',
                    amount,
                    percentage
                };
            })
            .sort((a, b) => b.amount - a.amount);
    }, [activeAccountId, transactions, categories]);

    // Unified account activity feed (transactions + transfers)
    interface ActivityItem {
        id: string;
        date: string;
        timestamp: number;
        kind: 'transaction' | 'transfer_out' | 'transfer_in';
        amount: number;
        title: string;
        subtitle?: string;
        categoryName?: string;
        categoryColor?: string;
        tags?: string[];
        originalTx?: Transaction;
        originalTf?: AccountTransfer;
    }

    const accountActivities = useMemo(() => {
        if (!activeAccountId) return [];
        const list: ActivityItem[] = [];

        // Add transactions for this account
        transactions?.forEach(tx => {
            if (tx.accountId === activeAccountId) {
                const cat = getCategory(tx.categoryId);
                list.push({
                    id: `tx_${tx.id}`,
                    date: tx.date,
                    timestamp: tx.createdAt || new Date(tx.date).getTime(),
                    kind: 'transaction',
                    amount: tx.amount,
                    title: tx.note || cat?.name || (tx.type === 'income' ? 'Income' : 'Expense'),
                    subtitle: cat?.name,
                    categoryName: cat?.name,
                    categoryColor: cat?.color || '#6366f1',
                    tags: tx.tags,
                    originalTx: tx
                });
            }
        });

        // Add transfers involving this account
        transfers?.forEach(tf => {
            if (tf.fromAccountId === activeAccountId) {
                list.push({
                    id: `tf_out_${tf.id}`,
                    date: tf.date,
                    timestamp: tf.createdAt || new Date(tf.date).getTime(),
                    kind: 'transfer_out',
                    amount: tf.amount,
                    title: `${language === 'id' ? 'Transfer ke' : 'Transfer to'} ${getAccountName(tf.toAccountId)}`,
                    subtitle: tf.note,
                    originalTf: tf
                });
            } else if (tf.toAccountId === activeAccountId) {
                list.push({
                    id: `tf_in_${tf.id}`,
                    date: tf.date,
                    timestamp: tf.createdAt || new Date(tf.date).getTime(),
                    kind: 'transfer_in',
                    amount: tf.amount,
                    title: `${language === 'id' ? 'Transfer dari' : 'Transfer from'} ${getAccountName(tf.fromAccountId)}`,
                    subtitle: tf.note,
                    originalTf: tf
                });
            }
        });

        // Sort by date (descending), then timestamp
        list.sort((a, b) => {
            if (a.date !== b.date) {
                return b.date.localeCompare(a.date);
            }
            return b.timestamp - a.timestamp;
        });

        // Apply type, category, and search filters
        return list.filter(item => {
            // Category filter
            if (selectedCategoryId) {
                if (item.kind !== 'transaction' || item.originalTx?.categoryId !== selectedCategoryId) {
                    return false;
                }
            }

            // Type filter
            if (txFilter === 'expense') {
                if (item.kind !== 'transaction' || item.originalTx?.type !== 'expense') return false;
            } else if (txFilter === 'income') {
                if (item.kind !== 'transaction' || item.originalTx?.type !== 'income') return false;
            } else if (txFilter === 'transfer') {
                if (item.kind !== 'transfer_in' && item.kind !== 'transfer_out') return false;
            }

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(q);
                const matchSub = item.subtitle?.toLowerCase().includes(q);
                const matchCat = item.categoryName?.toLowerCase().includes(q);
                const matchTag = item.tags?.some(tg => tg.toLowerCase().includes(q));
                const matchAmount = item.amount.toString().includes(q);
                if (!matchTitle && !matchSub && !matchCat && !matchTag && !matchAmount) return false;
            }

            return true;
        });
    }, [activeAccountId, transactions, transfers, categories, selectedCategoryId, txFilter, searchQuery, language]);

    // Reset Add/Edit Form
    const resetForm = () => {
        setName('');
        setType('bank');
        setColor(ACCOUNT_COLORS[0]);
        setBalance('');
        setAdjustBalance('');
        setShowAddForm(false);
        setEditingId(null);
    };

    // Open Edit Account Form
    const handleEdit = (account: Account) => {
        setName(account.name);
        setType(account.type);
        setColor(account.color);
        setEditingId(account.id);
        setAdjustBalance('');
        setShowAddForm(true);
    };

    // Delete Account
    const handleDelete = async (id: number) => {
        const txCount = transactions?.filter(t => t.accountId === id).length || 0;
        const tfCount = transfers?.filter(t => t.fromAccountId === id || t.toAccountId === id).length || 0;
        const total = txCount + tfCount;
        if (total > 0) {
            if (!confirm(language === 'id'
                ? `Akun ini memiliki ${total} transaksi/transfer terkait. Yakin ingin menghapus?`
                : `This account has ${total} associated records. Delete anyway?`)) return;
        }
        await db.accounts.delete(id);
        if (selectedAccountId === id) {
            setSelectedAccountId(null);
            setSelectedCategoryId(null);
        }
        addToast(t(language, 'delete') + ' ✓', 'info');
    };

    // Set Default Account
    const handleSetDefault = async (id: number) => {
        if (!accounts) return;
        for (const acc of accounts) {
            await db.accounts.update(acc.id, { isDefault: acc.id === id });
        }
        addToast(t(language, 'setAsDefault') + ' ✓', 'success');
    };

    // Submit Add/Edit Account
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            addToast(t(language, 'accountName'), 'error');
            return;
        }

        const accountData = {
            name: name.trim(),
            type,
            color,
            isDefault: accounts?.length === 0
        };

        if (editingId) {
            if (adjustBalance) {
                const targetBalance = parseFormattedNumber(adjustBalance);
                const transactionBalance = accountBalances[editingId] || 0;
                const currentAccount = accounts?.find(a => a.id === editingId);
                const currentManual = currentAccount?.manualBalance || 0;
                const newManualBalance = targetBalance - transactionBalance + currentManual;

                await db.accounts.update(editingId, {
                    ...accountData,
                    manualBalance: newManualBalance
                });
            } else {
                await db.accounts.update(editingId, accountData);
            }

            addToast(t(language, 'edit') + ' ✓', 'success');
        } else {
            const newAccountId = await db.accounts.add(accountData);
            if (balance && parseFormattedNumber(balance) > 0) {
                const defaultCategory = await db.categories.where('type').equals('income').first();
                if (defaultCategory && newAccountId) {
                    await db.transactions.add({
                        type: 'income',
                        amount: parseFormattedNumber(balance),
                        categoryId: defaultCategory.id,
                        accountId: Number(newAccountId),
                        date: formatLocalDate(new Date()),
                        note: 'Initial balance',
                        createdAt: Date.now()
                    });
                }
            }
            setSelectedAccountId(Number(newAccountId));
            setSelectedCategoryId(null);
            addToast(t(language, 'add') + ' ✓', 'success');
        }
        resetForm();
    };

    // Submit Transfer
    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
            addToast(language === 'id' ? 'Pilih akun asal dan tujuan yang berbeda' : 'Select different accounts', 'error');
            return;
        }

        const amount = parseFormattedNumber(transferAmount);
        if (amount <= 0) {
            addToast(t(language, 'amountError'), 'error');
            return;
        }

        const fromBalance = accountBalances[fromAccountId] || 0;
        if (amount > fromBalance) {
            addToast(language === 'id' ? 'Saldo akun asal tidak mencukupi' : 'Insufficient balance in source account', 'error');
            return;
        }

        await db.accountTransfers.add({
            fromAccountId,
            toAccountId,
            amount,
            date: formatLocalDate(new Date()),
            note: transferNote.trim() || undefined,
            createdAt: Date.now()
        });

        addToast(language === 'id' ? 'Transfer berhasil!' : 'Transfer complete', 'success');
        setShowTransfer(false);
        setTransferAmount('');
        setTransferNote('');
        setFromAccountId(0);
        setToAccountId(0);
    };

    // Delete Transfer
    const handleDeleteTransfer = async (id: number) => {
        if (!confirm(t(language, 'deleteConfirm'))) return;
        await db.accountTransfers.delete(id);
        addToast(t(language, 'delete') + ' ✓', 'info');
    };

    // Delete Transaction from feed
    const handleDeleteTransaction = async (id: number) => {
        if (!confirm(t(language, 'deleteThisTransaction'))) return;
        await db.transactions.delete(id);
        addToast(t(language, 'delete') + ' ✓', 'info');
    };

    if (!accounts) {
        return <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />;
    }

    return (
        <div className="accounts-view">
            {/* Top Total Balance Header */}
            <div className="accounts-header">
                <div className="total-balance">
                    <span className="label">{t(language, 'totalBalance')}</span>
                    <span className="amount">{formatCurrency(totalBalance)}</span>
                </div>
                <div className="header-actions">
                    {transfers && transfers.length > 0 && (
                        <button
                            onClick={() => setShowTransferHistory(true)}
                            className="acc-header-btn icon-only"
                            title={t(language, 'transferHistory')}
                        >
                            <History size={16} />
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (activeAccountId) setFromAccountId(activeAccountId);
                            setShowTransfer(true);
                        }}
                        className="acc-header-btn secondary"
                        disabled={accounts.length < 2}
                    >
                        <ArrowRightLeft size={15} />
                        <span>{language === 'id' ? 'Transfer' : 'Transfer'}</span>
                    </button>
                    <button onClick={() => setShowAddForm(true)} className="acc-header-btn primary">
                        <Plus size={16} />
                        <span>{t(language, 'add')} {t(language, 'accounts')}</span>
                    </button>
                </div>
            </div>

            {/* Account Cards Grid / Selector */}
            <div className="accounts-list">
                {accounts.length === 0 ? (
                    <div className="empty-accounts-box">
                        <Wallet size={40} className="empty-icon" />
                        <p className="empty-message">{language === 'id' ? 'Belum ada akun. Tambahkan akun pertama Anda!' : 'No accounts yet. Add your first account!'}</p>
                        <button onClick={() => setShowAddForm(true)} className="empty-cta-btn">
                            <Plus size={16} /> {t(language, 'add')} {t(language, 'accounts')}
                        </button>
                    </div>
                ) : (
                    accounts.map(account => {
                        const isSelected = account.id === activeAccountId;
                        const spent = accountSpentMap[account.id] || 0;
                        const bal = accountBalances[account.id] || 0;
                        const txCount = (transactions?.filter(t => t.accountId === account.id).length || 0) +
                            (transfers?.filter(tf => tf.fromAccountId === account.id || tf.toAccountId === account.id).length || 0);

                        return (
                            <div
                                key={account.id}
                                className={`account-card ${isSelected ? 'active-card' : ''} ${account.isDefault ? 'is-default' : ''}`}
                                style={{ borderLeftColor: account.color }}
                                onClick={() => setSelectedAccountId(account.id)}
                            >
                                {/* Card Header */}
                                <div className="account-card-header">
                                    <div className="account-brand-left">
                                        <div
                                            className="account-avatar"
                                            style={{ color: account.color, backgroundColor: `${account.color}18` }}
                                        >
                                            {ACCOUNT_ICONS[account.type]}
                                        </div>
                                        <div className="account-identity">
                                            <div className="account-title-line">
                                                <span className="account-title-text">{account.name}</span>
                                                {account.isDefault && (
                                                    <span className="default-star-badge" title={t(language, 'defaultBadge')}>
                                                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                                                    </span>
                                                )}
                                            </div>
                                            <span className="account-type-pill">{t(language, account.type as any) || account.type}</span>
                                        </div>
                                    </div>

                                    <div className="account-actions-toolbar" onClick={e => e.stopPropagation()}>
                                        {!account.isDefault && (
                                            <button
                                                onClick={() => handleSetDefault(account.id)}
                                                className="acc-icon-btn star"
                                                title={t(language, 'setAsDefault')}
                                            >
                                                <Star size={13} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(account)}
                                            className="acc-icon-btn"
                                            title={t(language, 'edit')}
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(account.id)}
                                            className="acc-icon-btn delete"
                                            title={t(language, 'delete')}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="account-card-body">
                                    <div className="account-balance-group">
                                        <span className="acc-label-caption">{t(language, 'balance')}</span>
                                        <span className={`acc-balance-num ${bal >= 0 ? 'positive' : 'negative'}`}>
                                            {formatCurrency(bal)}
                                        </span>
                                    </div>

                                    <div className="account-spent-group" title={`${t(language, 'totalSpent')}: ${formatCurrency(spent)}`}>
                                        <span className="acc-label-caption">{t(language, 'totalSpent')}</span>
                                        <div className="acc-spent-pill">
                                            <TrendingDown size={12} />
                                            <span>{formatCurrency(spent)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="account-card-footer">
                                    <span className="acc-tx-count">
                                        <Layers size={12} />
                                        <span>{txCount} {language === 'id' ? 'aktivitas' : 'records'}</span>
                                    </span>
                                    <span className={`acc-view-hint ${isSelected ? 'active-hint' : ''}`}>
                                        {isSelected ? (language === 'id' ? 'Aktif Dipilih ✓' : 'Currently Selected ✓') : (language === 'id' ? 'Lihat Rincian ➔' : 'View Details ➔')}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ========================================================================= */}
            {/* SELECTED ACCOUNT DETAIL & SPENDING DRILLDOWN */}
            {/* ========================================================================= */}
            {selectedAccount && (
                <div className="account-activity-section">
                    <div className="activity-section-header">
                        <div className="account-title-badge">
                            <div className="account-badge-icon" style={{ color: selectedAccount.color }}>
                                {ACCOUNT_ICONS[selectedAccount.type]}
                            </div>
                            <div>
                                <h3>{selectedAccount.name} — {t(language, 'accountActivity')}</h3>
                                <span className="account-subheading">{t(language, 'selectAccountToView')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Metrics Strip for this Account */}
                    <div className="account-metrics-strip">
                        <div className="metric-box spent">
                            <div className="metric-label">
                                <TrendingDown size={14} />
                                <span>{t(language, 'totalSpent')}</span>
                            </div>
                            <span className="metric-value">
                                {formatCurrency(accountSpentMap[selectedAccount.id] || 0)}
                            </span>
                        </div>

                        <div className="metric-box received">
                            <div className="metric-label">
                                <TrendingUp size={14} />
                                <span>{t(language, 'totalReceived')}</span>
                            </div>
                            <span className="metric-value">
                                {formatCurrency(accountIncomeMap[selectedAccount.id] || 0)}
                            </span>
                        </div>

                        <div className="metric-box transfers">
                            <div className="metric-label">
                                <ArrowRightLeft size={14} />
                                <span>{t(language, 'netTransfers')}</span>
                            </div>
                            <span className="metric-value">
                                {formatCurrency((accountTransferInMap[selectedAccount.id] || 0) - (accountTransferOutMap[selectedAccount.id] || 0))}
                            </span>
                        </div>
                    </div>

                    {/* Category Spending Breakdown for Selected Account */}
                    {accountCategorySpending.length > 0 && (
                        <div className="account-category-spending-card">
                            <div className="card-header-row">
                                <h4>
                                    <PieChart size={15} />
                                    <span>{t(language, 'spendingByCategory')}</span>
                                </h4>
                                {selectedCategoryId && (
                                    <button
                                        className="clear-cat-filter-mini-btn"
                                        onClick={() => setSelectedCategoryId(null)}
                                        title={language === 'id' ? 'Reset filter kategori' : 'Clear category filter'}
                                    >
                                        <X size={12} /> {language === 'id' ? 'Reset Filter' : 'Reset'}
                                    </button>
                                )}
                            </div>

                            <div className="category-bars-list">
                                {accountCategorySpending.map(cat => {
                                    const isCatActive = selectedCategoryId === cat.id;
                                    return (
                                        <div
                                            key={cat.id}
                                            className={`category-bar-item ${isCatActive ? 'active-filter' : ''}`}
                                            onClick={() => setSelectedCategoryId(prev => prev === cat.id ? null : cat.id)}
                                            title={isCatActive
                                                ? (language === 'id' ? 'Klik untuk membatalkan filter' : 'Click to clear filter')
                                                : (language === 'id' ? `Filter transaksi kategori ${cat.name}` : `Filter transactions by ${cat.name}`)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="category-bar-info">
                                                <div className="cat-dot-name">
                                                    <span className="cat-color-dot" style={{ backgroundColor: cat.color }} />
                                                    <span className="cat-name">{cat.name}</span>
                                                    {isCatActive && (
                                                        <span className="active-cat-badge">
                                                            <Check size={10} />
                                                            {language === 'id' ? 'Terpilih' : 'Filtered'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="cat-amounts">
                                                    <span className="cat-val">{formatCurrency(cat.amount)}</span>
                                                    <span className="cat-pct">{cat.percentage}%</span>
                                                </div>
                                            </div>
                                            <div className="cat-progress-track">
                                                <div
                                                    className="cat-progress-fill"
                                                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Active Category Filter Indicator */}
                            {selectedCategoryId && (
                                <div className="category-filter-notice">
                                    <div className="filter-notice-text">
                                        <Filter size={13} />
                                        <span>
                                            {language === 'id' ? 'Menampilkan kategori:' : 'Filtered by:'}{' '}
                                            <strong>{categories?.find(c => c.id === selectedCategoryId)?.name}</strong>
                                        </span>
                                    </div>
                                    <button
                                        className="clear-cat-filter-btn"
                                        onClick={() => setSelectedCategoryId(null)}
                                    >
                                        <X size={12} /> {language === 'id' ? 'Hapus Filter' : 'Clear Filter'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transactions Controls (Filter Pills + Search) */}
                    <div className="account-tx-control-bar">
                        <div className="tx-filter-pills">
                            <button
                                className={txFilter === 'all' ? 'active' : ''}
                                onClick={() => setTxFilter('all')}
                            >
                                {t(language, 'allTypes')}
                            </button>
                            <button
                                className={txFilter === 'expense' ? 'active expense' : ''}
                                onClick={() => setTxFilter('expense')}
                            >
                                {t(language, 'expense')}
                            </button>
                            <button
                                className={txFilter === 'income' ? 'active income' : ''}
                                onClick={() => setTxFilter('income')}
                            >
                                {t(language, 'income')}
                            </button>
                            <button
                                className={txFilter === 'transfer' ? 'active transfer' : ''}
                                onClick={() => setTxFilter('transfer')}
                            >
                                {t(language, 'transfersCount')}
                            </button>
                        </div>

                        <div className="account-search-wrapper">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder={t(language, 'searchPlaceholder')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="account-search-input"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="clear-search-btn">
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Account Transactions & Activity List */}
                    <div className="account-activity-list">
                        {accountActivities.length === 0 ? (
                            <div className="activity-empty-state">
                                <Layers size={36} className="empty-icon" />
                                <p>{t(language, 'noAccountTransactions')}</p>
                            </div>
                        ) : (
                            accountActivities.map(act => (
                                <div key={act.id} className="account-activity-item">
                                    <div className="item-left-block">
                                        <div className="activity-icon-bubble">
                                            {act.kind === 'transaction' ? (
                                                <span
                                                    className="cat-bubble-dot"
                                                    style={{ backgroundColor: act.categoryColor || '#6366f1' }}
                                                />
                                            ) : (
                                                <ArrowRightLeft size={15} className="transfer-bubble-icon" />
                                            )}
                                        </div>

                                        <div className="activity-text-info">
                                            <div className="activity-title-row">
                                                <span className="activity-title">{act.title}</span>
                                                {act.categoryName && act.kind === 'transaction' && (
                                                    <span
                                                        className="activity-cat-tag"
                                                        style={{
                                                            color: act.categoryColor,
                                                            backgroundColor: `${act.categoryColor}15`
                                                        }}
                                                    >
                                                        {act.categoryName}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="activity-meta-row">
                                                <span className="activity-date">
                                                    <Calendar size={11} /> {act.date}
                                                </span>
                                                {act.tags && act.tags.length > 0 && (
                                                    <div className="activity-tag-chips">
                                                        {act.tags.map(tg => (
                                                            <span key={tg} className="tag-chip">#{tg}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="item-right-block">
                                        <span className={`activity-amount ${
                                            act.kind === 'transaction'
                                                ? (act.originalTx?.type === 'income' ? 'income-val' : 'expense-val')
                                                : (act.kind === 'transfer_in' ? 'income-val' : 'expense-val')
                                        }`}>
                                            {act.kind === 'transaction'
                                                ? (act.originalTx?.type === 'income' ? `+${formatCurrency(act.amount)}` : `-${formatCurrency(act.amount)}`)
                                                : (act.kind === 'transfer_in' ? `+${formatCurrency(act.amount)}` : `-${formatCurrency(act.amount)}`)}
                                        </span>

                                        <div className="activity-actions">
                                            {act.kind === 'transaction' && act.originalTx && (
                                                <>
                                                    <button
                                                        className="tx-action-btn edit"
                                                        onClick={() => setEditingTransaction(act.originalTx!)}
                                                        title={t(language, 'edit')}
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        className="tx-action-btn delete"
                                                        onClick={() => handleDeleteTransaction(act.originalTx!.id)}
                                                        title={t(language, 'delete')}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </>
                                            )}
                                            {act.originalTf && (
                                                <button
                                                    className="tx-action-btn delete"
                                                    onClick={() => handleDeleteTransfer(act.originalTf!.id!)}
                                                    title={t(language, 'delete')}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TRANSFER HISTORY MODAL */}
            {/* ========================================================================= */}
            {showTransferHistory && transfers && (
                <div className="modal-overlay" onClick={() => setShowTransferHistory(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><History size={18} /> {t(language, 'transferHistory')}</h3>
                            <button onClick={() => setShowTransferHistory(false)}><X size={20} /></button>
                        </div>
                        <ul className="transfer-list-modal">
                            {transfers.length === 0 ? (
                                <p className="empty-message">{t(language, 'noData')}</p>
                            ) : (
                                transfers.map(tf => (
                                    <li key={tf.id} className="transfer-item">
                                        <div className="transfer-info">
                                            <span className="transfer-accounts">
                                                {getAccountName(tf.fromAccountId)} ➔ {getAccountName(tf.toAccountId)}
                                            </span>
                                            <span className="transfer-date">{tf.date}</span>
                                            {tf.note && <span className="transfer-note">{tf.note}</span>}
                                        </div>
                                        <div className="transfer-right">
                                            <span className="transfer-amount">{formatCurrency(tf.amount)}</span>
                                            <button
                                                className="tx-action-btn delete"
                                                onClick={() => handleDeleteTransfer(tf.id!)}
                                                title={t(language, 'delete')}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* ADD / EDIT ACCOUNT MODAL */}
            {/* ========================================================================= */}
            {showAddForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content compact" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? t(language, 'editAccount') : `${t(language, 'add')} ${t(language, 'accounts')}`}</h3>
                            <button onClick={resetForm}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="account-form">
                            <div className="form-group">
                                <label>{t(language, 'accountName')}</label>
                                <input
                                    type="text"
                                    placeholder={language === 'id' ? 'cth: BCA, Dompet, GoPay' : 'e.g., Bank, Cash, E-Wallet'}
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>{t(language, 'type')}</label>
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value as Account['type'])}
                                >
                                    <option value="bank">{t(language, 'bank')}</option>
                                    <option value="cash">{t(language, 'cash')}</option>
                                    <option value="ewallet">{t(language, 'ewallet')}</option>
                                    <option value="investment">{t(language, 'investment')}</option>
                                    <option value="other">{t(language, 'other')}</option>
                                </select>
                            </div>

                            {!editingId && (
                                <div className="form-group">
                                    <label>{t(language, 'initialBalance')}</label>
                                    <div className="amount-input-wrapper">
                                        <span className="currency-prefix">Rp</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={balance}
                                            onChange={e => {
                                                const digits = e.target.value.replace(/\D/g, '');
                                                setBalance(digits ? formatNumber(digits) : '');
                                            }}
                                            className="amount-input"
                                        />
                                    </div>
                                </div>
                            )}

                            {editingId && (
                                <div className="form-group">
                                    <label>{t(language, 'adjustBalance')}</label>
                                    <div className="amount-input-wrapper">
                                        <span className="currency-prefix">Rp</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder={formatCurrency(accountBalances[editingId] || 0)}
                                            value={adjustBalance}
                                            onChange={e => {
                                                const digits = e.target.value.replace(/\D/g, '');
                                                setAdjustBalance(digits ? formatNumber(digits) : '');
                                            }}
                                            className="amount-input"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>{t(language, 'color')}</label>
                                <div className="color-picker">
                                    {ACCOUNT_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`color-option ${color === c ? 'selected' : ''}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={resetForm} className="cancel-btn">
                                    {t(language, 'cancel')}
                                </button>
                                <button type="submit" className="submit-btn">
                                    <Check size={16} />
                                    {t(language, 'save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TRANSFER MODAL */}
            {/* ========================================================================= */}
            {showTransfer && accounts && (
                <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
                    <div className="modal-content compact" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><ArrowRightLeft size={18} /> {language === 'id' ? 'Transfer Antar Akun' : 'Transfer Between Accounts'}</h3>
                            <button onClick={() => setShowTransfer(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleTransfer} className="transfer-form">
                            <div className="form-group">
                                <label>{t(language, 'fromAccount')}</label>
                                <select
                                    value={fromAccountId}
                                    onChange={e => setFromAccountId(parseInt(e.target.value))}
                                    required
                                >
                                    <option value={0}>{language === 'id' ? '-- Pilih Akun Asal --' : '-- Select Source Account --'}</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({formatCurrency(accountBalances[acc.id] || 0)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t(language, 'toAccount')}</label>
                                <select
                                    value={toAccountId}
                                    onChange={e => setToAccountId(parseInt(e.target.value))}
                                    required
                                >
                                    <option value={0}>{language === 'id' ? '-- Pilih Akun Tujuan --' : '-- Select Destination Account --'}</option>
                                    {accounts.filter(a => a.id !== fromAccountId).map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({formatCurrency(accountBalances[acc.id] || 0)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t(language, 'transferAmount')}</label>
                                <div className="amount-input-wrapper">
                                    <span className="currency-prefix">Rp</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={transferAmount}
                                        onChange={e => {
                                            const digits = e.target.value.replace(/\D/g, '');
                                            setTransferAmount(digits ? formatNumber(digits) : '');
                                        }}
                                        className="amount-input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{t(language, 'transferNote')}</label>
                                <input
                                    type="text"
                                    placeholder={t(language, 'transferNote')}
                                    value={transferNote}
                                    onChange={e => setTransferNote(e.target.value)}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowTransfer(false)} className="cancel-btn">
                                    {t(language, 'cancel')}
                                </button>
                                <button type="submit" className="submit-btn primary">
                                    <Check size={16} />
                                    {language === 'id' ? 'Kirim Transfer' : 'Complete Transfer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
