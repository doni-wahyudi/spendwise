import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RecurringTransaction } from '../db/db';
import { getNextOccurrencePreview } from '../db/recurring';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/currency';
import { Plus, Trash2, Play, Pause, RefreshCw } from 'lucide-react';

export default function RecurringManager() {
    const recurring = useLiveQuery(() => db.recurringTransactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const [showForm, setShowForm] = useState(false);
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [frequency, setFrequency] = useState<RecurringTransaction['frequency']>('monthly');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const digits = value.replace(/\D/g, '');
        if (digits) {
            setAmount(formatNumber(digits));
        } else {
            setAmount('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFormattedNumber(amount);
        if (numericAmount <= 0 || !categoryId) return;

        await db.recurringTransactions.add({
            type,
            amount: numericAmount,
            categoryId: parseInt(categoryId),
            note,
            frequency,
            startDate,
            isActive: true
        });

        // Reset form
        setAmount('');
        setCategoryId('');
        setNote('');
        setShowForm(false);
    };

    const handleToggleActive = async (id: number, isActive: boolean) => {
        await db.recurringTransactions.update(id, { isActive: !isActive });
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this recurring transaction?')) {
            await db.recurringTransactions.delete(id);
        }
    };

    if (!recurring || !categories) return <div>Loading...</div>;

    const getCategory = (id: number) => categories.find(c => c.id === id);
    const getFrequencyLabel = (freq: RecurringTransaction['frequency']) => {
        const labels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
        return labels[freq];
    };

    return (
        <section className="settings-section">
            <div className="section-header">
                <h3>
                    <RefreshCw size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Recurring Transactions
                </h3>
                <button className="add-category-btn" onClick={() => setShowForm(!showForm)}>
                    <Plus size={16} />
                    Add
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="recurring-form">
                    <div className="form-row">
                        <div className="segmented-control small">
                            <button type="button" className={type === 'expense' ? 'active-expense' : ''} onClick={() => setType('expense')}>Expense</button>
                            <button type="button" className={type === 'income' ? 'active-income' : ''} onClick={() => setType('income')}>Income</button>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="amount-input-wrapper">
                            <span className="currency-prefix">Rp</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Amount"
                                value={amount}
                                onChange={handleAmountChange}
                                className="amount-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row two-col">
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                            <option value="" disabled>Category</option>
                            {categories.filter(c => c.type === type || c.type === 'both').map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <select value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringTransaction['frequency'])}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>

                    <div className="form-row two-col">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>

                    <button type="submit" className="submit-btn">Add Recurring</button>
                </form>
            )}

            {recurring.length === 0 ? (
                <p className="empty-message">No recurring transactions set up.</p>
            ) : (
                <ul className="recurring-list">
                    {recurring.map(r => {
                        const cat = getCategory(r.categoryId);
                        const nextOccurrence = getNextOccurrencePreview(r);
                        return (
                            <li key={r.id} className={`recurring-item ${!r.isActive ? 'inactive' : ''}`}>
                                <div className="recurring-info">
                                    <div className="recurring-main">
                                        <span className="tx-cat" style={{ backgroundColor: cat?.color }}>{cat?.name}</span>
                                        <span className={`recurring-amount ${r.type}`}>
                                            {r.type === 'expense' ? '-' : '+'}{formatCurrency(r.amount)}
                                        </span>
                                    </div>
                                    <div className="recurring-meta">
                                        <span className="recurring-freq">{getFrequencyLabel(r.frequency)}</span>
                                        <span className="recurring-next">Next: {nextOccurrence}</span>
                                    </div>
                                    {r.note && <span className="recurring-note">{r.note}</span>}
                                </div>
                                <div className="recurring-actions">
                                    <button onClick={() => handleToggleActive(r.id, r.isActive)} className="toggle-btn" title={r.isActive ? 'Pause' : 'Resume'}>
                                        {r.isActive ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    <button onClick={() => handleDelete(r.id)} className="delete-cat-btn" title="Delete">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
