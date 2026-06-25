import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account } from '../db/db';
import { Plus, Trash2, Wallet, Building2, Smartphone, CircleDollarSign } from 'lucide-react';

const ACCOUNT_ICONS: Record<Account['type'], React.ReactNode> = {
    cash: <Wallet size={16} />,
    bank: <Building2 size={16} />,
    ewallet: <Smartphone size={16} />,
    other: <CircleDollarSign size={16} />
};

export default function AccountManager() {
    const accounts = useLiveQuery(() => db.accounts.toArray());
    const transactions = useLiveQuery(() => db.transactions.toArray());

    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<Account['type']>('bank');
    const [color, setColor] = useState('#6366f1');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        await db.accounts.add({
            name: name.trim(),
            type,
            color,
            isDefault: false
        });

        setName('');
        setShowForm(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this account? Transactions linked to it will keep their reference.')) {
            await db.accounts.delete(id);
        }
    };

    const handleSetDefault = async (id: number) => {
        // Clear all defaults
        const all = await db.accounts.toArray();
        for (const acc of all) {
            if (acc.isDefault) {
                await db.accounts.update(acc.id, { isDefault: false });
            }
        }
        // Set new default
        await db.accounts.update(id, { isDefault: true });
    };

    if (!accounts || !transactions) return null;

    // Calculate balance per account
    const getAccountBalance = (accountId: number) => {
        const accountTx = transactions.filter(tx => tx.accountId === accountId);
        const income = accountTx.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const expense = accountTx.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
        return income - expense;
    };

    return (
        <section className="settings-section">
            <div className="section-header">
                <h3>
                    <Wallet size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Accounts
                </h3>
                <button className="add-category-btn" onClick={() => setShowForm(!showForm)}>
                    <Plus size={16} />
                    Add
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="new-category-form">
                    <input
                        type="text"
                        placeholder="Account name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <select value={type} onChange={(e) => setType(e.target.value as Account['type'])}>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank</option>
                        <option value="ewallet">E-Wallet</option>
                        <option value="other">Other</option>
                    </select>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="color-picker"
                    />
                    <button type="submit" className="submit-btn small">Add</button>
                </form>
            )}

            {accounts.length === 0 ? (
                <p className="empty-message">No accounts set up.</p>
            ) : (
                <ul className="account-list">
                    {accounts.map(acc => {
                        const balance = getAccountBalance(acc.id);
                        return (
                            <li key={acc.id} className={`account-item ${acc.isDefault ? 'default' : ''}`}>
                                <div className="account-info">
                                    <span className="account-icon" style={{ color: acc.color }}>
                                        {ACCOUNT_ICONS[acc.type]}
                                    </span>
                                    <div className="account-details">
                                        <span className="account-name">{acc.name}</span>
                                        <span className={`account-balance ${balance >= 0 ? 'positive' : 'negative'}`}>
                                            {balance >= 0 ? '+' : ''}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(balance)}
                                        </span>
                                    </div>
                                    {acc.isDefault && <span className="default-badge">Default</span>}
                                </div>
                                <div className="account-actions">
                                    {!acc.isDefault && (
                                        <button onClick={() => handleSetDefault(acc.id)} className="set-default-btn" title="Set as default">
                                            ★
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(acc.id)} className="delete-cat-btn" title="Delete">
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
