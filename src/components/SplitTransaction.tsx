import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { useToast } from '../store/useToast';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/currency';
import { Split, Plus, Trash2, Check } from 'lucide-react';

interface SplitItem {
    categoryId: string;
    amount: string;
    note: string;
}

export default function SplitTransaction() {
    const { addTransaction } = useStore();
    const { addToast } = useToast();
    const categories = useLiveQuery(() => db.categories.toArray());
    const accounts = useLiveQuery(() => db.accounts.toArray());

    const [showForm, setShowForm] = useState(false);
    const [totalAmount, setTotalAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState('');
    const [splits, setSplits] = useState<SplitItem[]>([
        { categoryId: '', amount: '', note: '' },
        { categoryId: '', amount: '', note: '' }
    ]);

    const expenseCategories = categories?.filter(c => c.type === 'expense' || c.type === 'both');

    const resetForm = () => {
        setTotalAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setAccountId('');
        setSplits([
            { categoryId: '', amount: '', note: '' },
            { categoryId: '', amount: '', note: '' }
        ]);
        setShowForm(false);
    };

    const updateSplit = (index: number, field: keyof SplitItem, value: string) => {
        setSplits(prev => {
            const newSplits = [...prev];
            newSplits[index] = { ...newSplits[index], [field]: value };
            return newSplits;
        });
    };

    const addSplit = () => {
        setSplits(prev => [...prev, { categoryId: '', amount: '', note: '' }]);
    };

    const removeSplit = (index: number) => {
        if (splits.length <= 2) return;
        setSplits(prev => prev.filter((_, i) => i !== index));
    };

    const calculateRemaining = () => {
        const total = parseFormattedNumber(totalAmount);
        const sumSplits = splits.reduce((sum, s) => sum + parseFormattedNumber(s.amount), 0);
        return total - sumSplits;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const remaining = calculateRemaining();
        if (Math.abs(remaining) > 1) { // Allow 1 rupiah margin
            addToast('Split amounts don\'t match total!', 'error');
            return;
        }

        const validSplits = splits.filter(s => s.categoryId && parseFormattedNumber(s.amount) > 0);
        if (validSplits.length < 2) {
            addToast('Add at least 2 split items', 'error');
            return;
        }

        // Create transactions for each split
        for (const split of validSplits) {
            await addTransaction({
                type: 'expense',
                amount: parseFormattedNumber(split.amount),
                categoryId: parseInt(split.categoryId),
                accountId: accountId ? parseInt(accountId) : undefined,
                date,
                note: split.note || undefined
            });
        }

        addToast(`Split into ${validSplits.length} transactions!`, 'success');
        resetForm();
    };

    // Auto-distribute remaining to last empty split
    const autoDistribute = () => {
        const remaining = calculateRemaining();
        if (remaining <= 0) return;

        // Find last split without amount
        const lastEmptyIndex = [...splits].reverse().findIndex(s => !s.amount || parseFormattedNumber(s.amount) === 0);
        if (lastEmptyIndex === -1) return;

        const actualIndex = splits.length - 1 - lastEmptyIndex;
        updateSplit(actualIndex, 'amount', formatNumber(remaining.toString()));
    };

    if (!categories) {
        return <div className="skeleton" style={{ height: 100 }} />;
    }

    const remaining = calculateRemaining();

    return (
        <section className="settings-section split-transaction">
            <div className="section-header">
                <h3><Split size={18} /> Split Transaction</h3>
                <button onClick={() => setShowForm(!showForm)} className="add-btn">
                    {showForm ? '×' : <Plus size={16} />}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="split-form">
                    <div className="split-header">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Total Amount"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(formatNumber(e.target.value.replace(/\D/g, '')))}
                            required
                        />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {accounts && accounts.length > 0 && (
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                        >
                            <option value="">Select account</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    )}

                    <div className="splits-list">
                        {splits.map((split, index) => (
                            <div key={index} className="split-row">
                                <select
                                    value={split.categoryId}
                                    onChange={(e) => updateSplit(index, 'categoryId', e.target.value)}
                                    required
                                >
                                    <option value="">Category</option>
                                    {expenseCategories?.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Amount"
                                    value={split.amount}
                                    onChange={(e) => updateSplit(index, 'amount', formatNumber(e.target.value.replace(/\D/g, '')))}
                                />
                                <input
                                    type="text"
                                    placeholder="Note"
                                    value={split.note}
                                    onChange={(e) => updateSplit(index, 'note', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSplit(index)}
                                    disabled={splits.length <= 2}
                                    className="remove-split"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="split-actions-row">
                        <button type="button" onClick={addSplit} className="add-split-btn">
                            + Add Split
                        </button>
                        {remaining > 0 && (
                            <button type="button" onClick={autoDistribute} className="auto-btn">
                                Auto-fill {formatCurrency(remaining)}
                            </button>
                        )}
                    </div>

                    <div className={`split-remaining ${remaining === 0 ? 'balanced' : remaining < 0 ? 'over' : ''}`}>
                        {remaining === 0 ? (
                            <><Check size={16} /> Perfectly balanced</>
                        ) : remaining > 0 ? (
                            <>Remaining: {formatCurrency(remaining)}</>
                        ) : (
                            <>Over by: {formatCurrency(Math.abs(remaining))}</>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={resetForm} className="cancel-btn">Cancel</button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={Math.abs(remaining) > 1}
                        >
                            Create Split
                        </button>
                    </div>
                </form>
            )}

            {!showForm && (
                <p className="empty-message">
                    Split a purchase across multiple categories (e.g., groceries with household items).
                </p>
            )}
        </section>
    );
}
