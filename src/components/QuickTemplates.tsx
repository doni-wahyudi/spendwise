import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TransactionTemplate } from '../db/db';
import { useStore } from '../store/useStore';
import { useToast } from '../store/useToast';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/currency';
import { Zap, Plus, Trash2, Play } from 'lucide-react';

export default function QuickTemplates() {
    const { addTransaction } = useStore();
    const { addToast } = useToast();
    const templates = useLiveQuery(() =>
        db.transactionTemplates.orderBy('usageCount').reverse().toArray()
    );
    const categories = useLiveQuery(() => db.categories.toArray());
    const accounts = useLiveQuery(() => db.accounts.toArray());

    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [note, setNote] = useState('');

    const resetForm = () => {
        setName('');
        setType('expense');
        setAmount('');
        setCategoryId('');
        setAccountId('');
        setNote('');
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !categoryId) return;

        await db.transactionTemplates.add({
            name,
            type,
            amount: parseFormattedNumber(amount),
            categoryId: parseInt(categoryId),
            accountId: accountId ? parseInt(accountId) : undefined,
            note: note || undefined,
            usageCount: 0
        });

        addToast('Template created!', 'success');
        resetForm();
    };

    const handleUseTemplate = async (template: TransactionTemplate) => {
        await addTransaction({
            type: template.type,
            amount: template.amount,
            categoryId: template.categoryId,
            accountId: template.accountId,
            date: new Date().toISOString().split('T')[0],
            note: template.note
        });

        // Increment usage count
        await db.transactionTemplates.update(template.id, {
            usageCount: template.usageCount + 1
        });

        addToast(`Added ${template.name}!`, 'success');
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this template?')) {
            await db.transactionTemplates.delete(id);
            addToast('Template deleted', 'info');
        }
    };

    const getCategoryColor = (id: number) =>
        categories?.find(c => c.id === id)?.color || '#6366f1';

    const filteredCategories = categories?.filter(c =>
        type === 'income'
            ? (c.type === 'income' || c.type === 'both')
            : (c.type === 'expense' || c.type === 'both')
    );

    if (!templates || !categories) {
        return <div className="skeleton" style={{ height: 100 }} />;
    }

    return (
        <section className="settings-section quick-templates">
            <div className="section-header">
                <h3><Zap size={18} /> Quick Templates</h3>
                <button onClick={() => setShowForm(!showForm)} className="add-btn">
                    <Plus size={16} />
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="template-form">
                    <input
                        type="text"
                        placeholder="Template name (e.g., Coffee)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <div className="segmented-control">
                        <button
                            type="button"
                            className={type === 'expense' ? 'active' : ''}
                            onClick={() => setType('expense')}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            className={type === 'income' ? 'active' : ''}
                            onClick={() => setType('income')}
                        >
                            Income
                        </button>
                    </div>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(formatNumber(e.target.value.replace(/\D/g, '')))}
                        required
                    />
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                    >
                        <option value="">Select category</option>
                        {filteredCategories?.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {accounts && accounts.length > 0 && (
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                        >
                            <option value="">Default account</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    )}
                    <input
                        type="text"
                        placeholder="Note (optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="form-actions">
                        <button type="button" onClick={resetForm} className="cancel-btn">Cancel</button>
                        <button type="submit" className="submit-btn">Save Template</button>
                    </div>
                </form>
            )}

            {templates.length === 0 ? (
                <p className="empty-message">No templates yet. Create one for quick entries!</p>
            ) : (
                <div className="templates-grid">
                    {templates.map(template => (
                        <div
                            key={template.id}
                            className="template-card"
                            onClick={() => handleUseTemplate(template)}
                        >
                            <div
                                className="template-icon"
                                style={{ backgroundColor: getCategoryColor(template.categoryId) }}
                            >
                                <Play size={14} />
                            </div>
                            <div className="template-info">
                                <span className="template-name">{template.name}</span>
                                <span className="template-amount">
                                    {template.type === 'expense' ? '-' : '+'}
                                    {formatCurrency(template.amount)}
                                </span>
                            </div>
                            <button
                                className="template-delete"
                                onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
