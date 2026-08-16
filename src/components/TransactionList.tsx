import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { Pencil, Copy } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { formatLocalDate } from '../utils/dateUtils';
import { useState, useRef } from 'react';

interface Props {
    limit?: number;
    useFilter?: boolean;
    useSearch?: boolean;
}

export default function TransactionList({ limit, useFilter = false, useSearch = false }: Props) {
    const { deleteTransaction, setEditingTransaction, setActiveTab, dateRange, addTransaction, searchFilter } = useStore();
    const [swipingId, setSwipingId] = useState<number | null>(null);
    const touchStartX = useRef(0);

    const categories = useLiveQuery(() => db.categories.toArray());

    const transactions = useLiveQuery(async () => {
        let collection = db.transactions.orderBy('date').reverse();
        const all = await collection.toArray();
        const allCats = categories || await db.categories.toArray();

        let filtered = all;

        // Date filter (for dashboard)
        if (useFilter) {
            filtered = filtered.filter(tx => tx.date >= dateRange.startDate && tx.date <= dateRange.endDate);
        }

        // Search filter (for transactions tab)
        if (useSearch) {
            // Text search
            if (searchFilter.searchText) {
                const searchLower = searchFilter.searchText.toLowerCase().trim();
                filtered = filtered.filter(tx => {
                    const noteMatch = tx.note?.toLowerCase().includes(searchLower);
                    const catName = allCats.find(c => c.id === tx.categoryId)?.name.toLowerCase();
                    const catMatch = catName?.includes(searchLower);
                    const tagMatch = tx.tags?.some(t => t.toLowerCase().includes(searchLower));
                    const amountMatch = tx.amount.toString().includes(searchLower);
                    return noteMatch || catMatch || tagMatch || amountMatch;
                });
            }

            // Category filter
            if (searchFilter.categoryId) {
                filtered = filtered.filter(tx => tx.categoryId === searchFilter.categoryId);
            }

            // Type filter
            if (searchFilter.type !== 'all') {
                filtered = filtered.filter(tx => tx.type === searchFilter.type);
            }

            // Tag filter
            if (searchFilter.tag) {
                filtered = filtered.filter(tx => tx.tags?.includes(searchFilter.tag!));
            }
        }

        if (limit) {
            return filtered.slice(0, limit);
        }
        return filtered;
    }, [limit, useFilter, useSearch, dateRange, searchFilter, categories]);

    if (!transactions || !categories) {
        return (
            <div className="transaction-list">
                <h3>Recent Transactions</h3>
                <div className="transaction-item skeleton" />
                <div className="transaction-item skeleton" />
                <div className="transaction-item skeleton" />
            </div>
        );
    }

    const getCategory = (id: number) => categories.find(c => c.id === id);

    const handleEdit = (tx: typeof transactions[0]) => {
        setEditingTransaction(tx);
        // Note: This works with the modal transaction form in App.tsx
    };

    const handleDuplicate = async (tx: typeof transactions[0]) => {
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
        if (confirm('Are you sure you want to delete this transaction?')) {
            deleteTransaction(id);
        }
    };

    const handleTouchStart = (e: React.TouchEvent, id: number) => {
        touchStartX.current = e.touches[0].clientX;
        setSwipingId(id);
    };

    const handleTouchMove = (e: React.TouchEvent, id: number) => {
        if (swipingId !== id) return;
        const diff = touchStartX.current - e.touches[0].clientX;
        const element = e.currentTarget as HTMLLIElement;
        if (diff > 0) {
            element.style.transform = `translateX(-${Math.min(diff, 80)}px)`;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const element = e.currentTarget as HTMLLIElement;
        const diff = touchStartX.current - e.changedTouches[0].clientX;

        if (diff > 60) {
            element.style.transform = 'translateX(-80px)';
        } else {
            element.style.transform = 'translateX(0)';
        }
        setSwipingId(null);
    };

    const title = useSearch ? `Transactions (${transactions.length})` : (useFilter ? 'Transactions' : 'Recent Transactions');

    return (
        <div className="transaction-list">
            <h3>{title}</h3>
            {transactions.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-message">No transactions found.</p>
                    {!useSearch && (
                        <button
                            className="empty-state-cta"
                            onClick={() => setActiveTab('dashboard')}
                        >
                            + Add Your First Transaction
                        </button>
                    )}
                </div>
            ) : (
                <ul>
                    {transactions.map(tx => {
                        const cat = getCategory(tx.categoryId);
                        return (
                            <li
                                key={tx.id}
                                className="transaction-item swipeable"
                                onTouchStart={(e) => handleTouchStart(e, tx.id)}
                                onTouchMove={(e) => handleTouchMove(e, tx.id)}
                                onTouchEnd={(e) => handleTouchEnd(e)}
                            >
                                <div className="tx-info">
                                    <span className="tx-cat" style={{ backgroundColor: cat?.color }}>{cat?.name}</span>
                                    <span className="tx-date">{tx.date}</span>
                                    {tx.note && <span className="tx-note">{tx.note}</span>}
                                    {tx.tags && tx.tags.length > 0 && (
                                        <div className="tx-tags">
                                            {tx.tags.map(tag => (
                                                <span key={tag} className="tag-badge">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="tx-amount-group">
                                    <span className={`tx-amount ${tx.type}`}>
                                        {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                                    </span>
                                    <button onClick={() => handleDuplicate(tx)} className="duplicate-btn" title="Duplicate">
                                        <Copy size={14} />
                                    </button>
                                    <button onClick={() => handleEdit(tx)} className="edit-btn" title="Edit">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(tx.id)} className="delete-btn" title="Delete">×</button>
                                </div>
                                <div className="swipe-delete-bg" onClick={() => handleDelete(tx.id)}>
                                    Delete
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
