import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import { formatLocalDate } from '../utils/dateUtils';
import { Pencil, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchFilter from './SearchFilter';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function RecordsView() {
    const { deleteTransaction, setEditingTransaction, addTransaction, searchFilter } = useStore();
    const [period, setPeriod] = useState<Period>('daily');
    const [currentDate, setCurrentDate] = useState(new Date());

    const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const getCategory = (id: number) => categories?.find(c => c.id === id);

    // Calculate date range based on period
    const { startDate, endDate, label } = useMemo(() => {
        const d = new Date(currentDate);
        let start: Date, end: Date, lbl: string;

        switch (period) {
            case 'daily':
                start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                end = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                lbl = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                break;
            case 'weekly':
                const dayOfWeek = d.getDay();
                const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                start = new Date(d.getFullYear(), d.getMonth(), diff);
                end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
                lbl = `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                break;
            case 'monthly':
                start = new Date(d.getFullYear(), d.getMonth(), 1);
                end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                lbl = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                break;
            case 'yearly':
                start = new Date(d.getFullYear(), 0, 1);
                end = new Date(d.getFullYear(), 11, 31);
                lbl = d.getFullYear().toString();
                break;
        }

        return {
            startDate: formatLocalDate(start),
            endDate: formatLocalDate(end),
            label: lbl
        };
    }, [currentDate, period]);

    // Filter transactions by period AND search filter
    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        let result = transactions.filter(tx => tx.date >= startDate && tx.date <= endDate);

        // Text search
        if (searchFilter.searchText) {
            const searchLower = searchFilter.searchText.toLowerCase().trim();
            result = result.filter(tx => {
                const noteMatch = tx.note?.toLowerCase().includes(searchLower);
                const catName = categories?.find(c => c.id === tx.categoryId)?.name.toLowerCase();
                const catMatch = catName?.includes(searchLower);
                const tagMatch = tx.tags?.some(t => t.toLowerCase().includes(searchLower));
                const amountMatch = tx.amount.toString().includes(searchLower);
                return noteMatch || catMatch || tagMatch || amountMatch;
            });
        }

        // Category filter
        if (searchFilter.categoryId) {
            result = result.filter(tx => tx.categoryId === searchFilter.categoryId);
        }

        // Type filter
        if (searchFilter.type !== 'all') {
            result = result.filter(tx => tx.type === searchFilter.type);
        }

        // Tag filter
        if (searchFilter.tag) {
            result = result.filter(tx => tx.tags?.includes(searchFilter.tag!));
        }

        return result;
    }, [transactions, startDate, endDate, searchFilter, categories]);

    // Calculate totals
    const totals = useMemo(() => {
        return filteredTransactions.reduce((acc, tx) => {
            if (tx.type === 'income') acc.income += tx.amount;
            else acc.expense += tx.amount;
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredTransactions]);

    // Navigation functions
    const navigate = (direction: number) => {
        const d = new Date(currentDate);
        switch (period) {
            case 'daily':
                d.setDate(d.getDate() + direction);
                break;
            case 'weekly':
                d.setDate(d.getDate() + (direction * 7));
                break;
            case 'monthly':
                d.setMonth(d.getMonth() + direction);
                break;
            case 'yearly':
                d.setFullYear(d.getFullYear() + direction);
                break;
        }
        setCurrentDate(d);
    };

    const goToToday = () => setCurrentDate(new Date());

    const handleEdit = (tx: typeof filteredTransactions[0]) => {
        setEditingTransaction(tx);
        // Modal will open via useEffect in App.tsx, stay on records view
    };

    const handleDuplicate = async (tx: typeof filteredTransactions[0]) => {
        await addTransaction({
            type: tx.type,
            amount: tx.amount,
            categoryId: tx.categoryId,
            accountId: tx.accountId,
            date: formatLocalDate(new Date()),
            note: tx.note,
            tags: tx.tags
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this transaction?')) {
            deleteTransaction(id);
        }
    };

    if (!transactions || !categories) {
        return (
            <div className="records-view">
                <div className="skeleton" style={{ height: 200 }} />
            </div>
        );
    }

    return (
        <div className="records-view">
            {/* Period Selector */}
            <div className="period-selector">
                {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map(p => (
                    <button
                        key={p}
                        className={period === p ? 'active' : ''}
                        onClick={() => setPeriod(p)}
                    >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}
            </div>

            {/* Navigation */}
            <div className="period-nav">
                <button onClick={() => navigate(-1)} className="nav-arrow">
                    <ChevronLeft size={20} />
                </button>
                <div className="period-info">
                    <span className="period-label">{label}</span>
                    <button onClick={goToToday} className="today-btn">Today</button>
                </div>
                <button onClick={() => navigate(1)} className="nav-arrow">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Summary */}
            <div className="period-summary">
                <div className="summary-item income">
                    <span className="label">Income</span>
                    <span className="value">+{formatCurrency(totals.income)}</span>
                </div>
                <div className="summary-item expense">
                    <span className="label">Expense</span>
                    <span className="value">-{formatCurrency(totals.expense)}</span>
                </div>
                <div className="summary-item balance">
                    <span className="label">Balance</span>
                    <span className={`value ${totals.income - totals.expense >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(totals.income - totals.expense)}
                    </span>
                </div>
            </div>

            {/* Transactions List */}
            <div className="records-list">
                <h3>Transactions ({filteredTransactions.length})</h3>
                <SearchFilter />
                {filteredTransactions.length === 0 ? (
                    <p className="empty-message">No transactions in this period.</p>
                ) : (
                    <div className={`scrollable-records ${(period === 'monthly' || period === 'yearly') && filteredTransactions.length > 8 ? 'scrollable' : ''}`}>
                        <ul>
                            {filteredTransactions.map(tx => {
                                const cat = getCategory(tx.categoryId);
                                return (
                                    <li key={tx.id} className="record-item">
                                        <div className="record-main">
                                            <span
                                                className="cat-dot"
                                                style={{ backgroundColor: cat?.color || '#6366f1' }}
                                            />
                                            <div className="record-details">
                                                <span className="record-category">{cat?.name || 'Unknown'}</span>
                                                <span className="record-date">{tx.date}</span>
                                                {tx.note && <span className="record-note">{tx.note}</span>}
                                                {tx.tags && tx.tags.length > 0 && (
                                                    <div className="record-tags">
                                                        {tx.tags.map(tag => (
                                                            <span key={tag} className="tag-badge">#{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`record-amount ${tx.type}`}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </span>
                                        </div>
                                        <div className="record-actions">
                                            <button onClick={() => handleDuplicate(tx)} title="Duplicate">
                                                <Copy size={14} />
                                            </button>
                                            <button onClick={() => handleEdit(tx)} title="Edit">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(tx.id)} className="delete-btn" title="Delete">
                                                ×
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
