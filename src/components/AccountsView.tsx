import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account } from '../db/db';
import { useToast } from '../store/useToast';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/currency';
import { Wallet, Plus, Trash2, Edit2, ArrowRightLeft, Building2, Smartphone, PiggyBank, X, Check, History } from 'lucide-react';

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

export default function AccountsView() {
    const { addToast } = useToast();
    const accounts = useLiveQuery(() => db.accounts.toArray());
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const transfers = useLiveQuery(() => db.accountTransfers.orderBy('date').reverse().toArray());

    const [showAddForm, setShowAddForm] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showTransferHistory, setShowTransferHistory] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Add/Edit form state
    const [name, setName] = useState('');
    const [type, setType] = useState<Account['type']>('bank');
    const [color, setColor] = useState(ACCOUNT_COLORS[0]);
    const [balance, setBalance] = useState('');

    // Transfer state
    const [fromAccountId, setFromAccountId] = useState<number>(0);
    const [toAccountId, setToAccountId] = useState<number>(0);
    const [transferAmount, setTransferAmount] = useState('');
    const [transferNote, setTransferNote] = useState('');
    const [adjustBalance, setAdjustBalance] = useState('');

    // Calculate actual balance from transactions, transfers, AND manualBalance
    const accountBalances = useMemo(() => {
        if (!transactions || !accounts) return {};

        const balances: Record<number, number> = {};
        accounts.forEach(acc => balances[acc.id] = acc.manualBalance || 0);

        // Add transaction amounts
        transactions.forEach(tx => {
            if (tx.accountId && balances[tx.accountId] !== undefined) {
                if (tx.type === 'income') {
                    balances[tx.accountId] += tx.amount;
                } else {
                    balances[tx.accountId] -= tx.amount;
                }
            }
        });

        // Apply transfers
        transfers?.forEach(tf => {
            if (balances[tf.fromAccountId] !== undefined) {
                balances[tf.fromAccountId] -= tf.amount;
            }
            if (balances[tf.toAccountId] !== undefined) {
                balances[tf.toAccountId] += tf.amount;
            }
        });

        return balances;
    }, [transactions, accounts, transfers]);

    const totalBalance = useMemo(() => {
        return Object.values(accountBalances).reduce((sum, bal) => sum + bal, 0);
    }, [accountBalances]);

    const getAccountName = (id: number) => accounts?.find(a => a.id === id)?.name || 'Unknown';

    const resetForm = () => {
        setName('');
        setType('bank');
        setColor(ACCOUNT_COLORS[0]);
        setBalance('');
        setAdjustBalance('');
        setShowAddForm(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            addToast('Please enter account name', 'error');
            return;
        }

        const accountData = {
            name: name.trim(),
            type,
            color,
            isDefault: accounts?.length === 0
        };

        if (editingId) {
            // Handle manual balance adjustment if provided
            if (adjustBalance) {
                const targetBalance = parseFormattedNumber(adjustBalance);
                const transactionBalance = accountBalances[editingId] || 0;
                // Get current manualBalance (if any)
                const currentAccount = accounts?.find(a => a.id === editingId);
                const currentManual = currentAccount?.manualBalance || 0;
                // Calculate what manualBalance needs to be so total = target
                const newManualBalance = targetBalance - transactionBalance + currentManual;

                await db.accounts.update(editingId, {
                    ...accountData,
                    manualBalance: newManualBalance
                });
            } else {
                await db.accounts.update(editingId, accountData);
            }

            addToast('Account updated', 'success');
        } else {
            await db.accounts.add(accountData);
            // Add initial balance as income if provided
            if (balance && parseFormattedNumber(balance) > 0) {
                const defaultCategory = await db.categories.where('type').equals('income').first();
                if (defaultCategory) {
                    const newAccountId = await db.accounts.orderBy('id').last();
                    if (newAccountId) {
                        await db.transactions.add({
                            type: 'income',
                            amount: parseFormattedNumber(balance),
                            categoryId: defaultCategory.id,
                            accountId: newAccountId.id,
                            date: new Date().toISOString().split('T')[0],
                            note: 'Initial balance',
                            createdAt: Date.now()
                        });
                    }
                }
            }
            addToast('Account created', 'success');
        }
        resetForm();
    };

    const handleEdit = (account: Account) => {
        setName(account.name);
        setType(account.type);
        setColor(account.color);
        setEditingId(account.id);
        setAdjustBalance(''); // Clear adjustment field
        setShowAddForm(true);
    };

    const handleDelete = async (id: number) => {
        const txCount = transactions?.filter(t => t.accountId === id).length || 0;
        const tfCount = transfers?.filter(t => t.fromAccountId === id || t.toAccountId === id).length || 0;
        const total = txCount + tfCount;
        if (total > 0) {
            if (!confirm(`This account has ${total} records. Delete anyway?`)) return;
        }
        await db.accounts.delete(id);
        addToast('Account deleted', 'info');
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
            addToast('Select different accounts', 'error');
            return;
        }

        const amount = parseFormattedNumber(transferAmount);
        if (amount <= 0) {
            addToast('Enter valid amount', 'error');
            return;
        }

        const fromBalance = accountBalances[fromAccountId] || 0;
        if (amount > fromBalance) {
            addToast('Insufficient balance', 'error');
            return;
        }

        // Create transfer record (NOT transactions)
        await db.accountTransfers.add({
            fromAccountId,
            toAccountId,
            amount,
            date: new Date().toISOString().split('T')[0],
            note: transferNote.trim() || undefined,
            createdAt: Date.now()
        });

        addToast('Transfer complete', 'success');
        setShowTransfer(false);
        setTransferAmount('');
        setTransferNote('');
        setFromAccountId(0);
        setToAccountId(0);
    };

    const handleDeleteTransfer = async (id: number) => {
        if (!confirm('Delete this transfer?')) return;
        await db.accountTransfers.delete(id);
        addToast('Transfer deleted', 'info');
    };

    if (!accounts) {
        return <div className="skeleton" style={{ height: 200 }} />;
    }

    return (
        <div className="accounts-view">
            <div className="accounts-header">
                <div className="total-balance">
                    <span className="label">Total Balance</span>
                    <span className="amount">{formatCurrency(totalBalance)}</span>
                </div>
                <div className="header-actions">
                    {transfers && transfers.length > 0 && (
                        <button onClick={() => setShowTransferHistory(true)} className="history-btn" title="Transfer History">
                            <History size={16} />
                        </button>
                    )}
                    <button onClick={() => setShowTransfer(true)} className="transfer-btn" disabled={accounts.length < 2}>
                        <ArrowRightLeft size={16} />
                        Transfer
                    </button>
                    <button onClick={() => setShowAddForm(true)} className="add-btn">
                        <Plus size={16} />
                        Add
                    </button>
                </div>
            </div>

            <div className="accounts-list">
                {accounts.length === 0 ? (
                    <p className="empty-message">No accounts yet. Add your first account!</p>
                ) : (
                    accounts.map(account => (
                        <div key={account.id} className="account-card" style={{ borderLeftColor: account.color }}>
                            <div className="account-icon" style={{ color: account.color }}>
                                {ACCOUNT_ICONS[account.type]}
                            </div>
                            <div className="account-info">
                                <span className="account-name">{account.name}</span>
                                <span className="account-type">{account.type}</span>
                            </div>
                            <div className="account-balance">
                                <span className={accountBalances[account.id] >= 0 ? 'positive' : 'negative'}>
                                    {formatCurrency(accountBalances[account.id] || 0)}
                                </span>
                            </div>
                            <div className="account-actions">
                                <button onClick={() => handleEdit(account)}>
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(account.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Transfer History */}
            {transfers && transfers.length > 0 && (
                <section className="transfer-history-section">
                    <h3><History size={16} /> Recent Transfers</h3>
                    <ul className="transfer-list">
                        {transfers.slice(0, 5).map(tf => (
                            <li key={tf.id} className="transfer-item">
                                <div className="transfer-info">
                                    <span className="transfer-accounts">
                                        {getAccountName(tf.fromAccountId)} → {getAccountName(tf.toAccountId)}
                                    </span>
                                    <span className="transfer-date">{tf.date}</span>
                                    {tf.note && <span className="transfer-note">{tf.note}</span>}
                                </div>
                                <span className="transfer-amount">{formatCurrency(tf.amount)}</span>
                                <button onClick={() => handleDeleteTransfer(tf.id!)} className="delete-btn" title="Delete">
                                    <Trash2 size={12} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Add/Edit Modal */}
            {showAddForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Account' : 'Add Account'}</h3>
                            <button onClick={resetForm}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Account name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                autoFocus
                            />
                            <select value={type} onChange={e => setType(e.target.value as Account['type'])}>
                                <option value="bank">Bank</option>
                                <option value="cash">Cash</option>
                                <option value="ewallet">E-Wallet</option>
                                <option value="other">Other</option>
                            </select>
                            {!editingId && (
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Initial balance (optional)"
                                    value={balance}
                                    onChange={e => setBalance(formatNumber(e.target.value))}
                                />
                            )}
                            {editingId && (
                                <div className="balance-adjust-section">
                                    <label>Current Balance: {formatCurrency(accountBalances[editingId] || 0)}</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Set new balance (leave empty to keep)"
                                        value={adjustBalance}
                                        onChange={e => setAdjustBalance(formatNumber(e.target.value))}
                                    />
                                </div>
                            )}
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
                            <button type="submit" className="submit-btn">
                                <Check size={16} />
                                {editingId ? 'Update' : 'Create'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransfer && (
                <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><ArrowRightLeft size={18} /> Transfer Between Accounts</h3>
                            <button onClick={() => setShowTransfer(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleTransfer}>
                            <label>From Account</label>
                            <select value={fromAccountId} onChange={e => setFromAccountId(Number(e.target.value))}>
                                <option value={0}>Select account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({formatCurrency(accountBalances[acc.id] || 0)})
                                    </option>
                                ))}
                            </select>

                            <label>To Account</label>
                            <select value={toAccountId} onChange={e => setToAccountId(Number(e.target.value))}>
                                <option value={0}>Select account</option>
                                {accounts.filter(a => a.id !== fromAccountId).map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({formatCurrency(accountBalances[acc.id] || 0)})
                                    </option>
                                ))}
                            </select>

                            <label>Amount</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Transfer amount"
                                value={transferAmount}
                                onChange={e => setTransferAmount(formatNumber(e.target.value))}
                            />

                            <label>Note (optional)</label>
                            <input
                                type="text"
                                placeholder="e.g., Monthly savings"
                                value={transferNote}
                                onChange={e => setTransferNote(e.target.value)}
                            />

                            <button type="submit" className="submit-btn">
                                <ArrowRightLeft size={16} />
                                Transfer
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer History Modal */}
            {showTransferHistory && (
                <div className="modal-overlay" onClick={() => setShowTransferHistory(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><History size={18} /> Transfer History</h3>
                            <button onClick={() => setShowTransferHistory(false)}><X size={20} /></button>
                        </div>
                        <div className="transfer-history-full">
                            {transfers?.length === 0 ? (
                                <p className="empty-message">No transfers yet.</p>
                            ) : (
                                <ul className="transfer-list">
                                    {transfers?.map(tf => (
                                        <li key={tf.id} className="transfer-item">
                                            <div className="transfer-info">
                                                <span className="transfer-accounts">
                                                    {getAccountName(tf.fromAccountId)} → {getAccountName(tf.toAccountId)}
                                                </span>
                                                <span className="transfer-date">{tf.date}</span>
                                                {tf.note && <span className="transfer-note">{tf.note}</span>}
                                            </div>
                                            <span className="transfer-amount">{formatCurrency(tf.amount)}</span>
                                            <button onClick={() => handleDeleteTransfer(tf.id!)} className="delete-btn" title="Delete">
                                                <Trash2 size={12} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
