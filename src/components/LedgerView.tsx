import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LedgerItem } from '../db/db';
import { useToast } from '../store/useToast';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/currency';
import { BookOpen, Plus, Trash2, Edit2, Check, X, ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';

export default function LedgerView() {
    const { addToast } = useToast();
    const ledgerItems = useLiveQuery(() => db.ledger.orderBy('createdAt').reverse().toArray());

    const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form state
    const [personName, setPersonName] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [dueDate, setDueDate] = useState('');

    const resetForm = () => {
        setPersonName('');
        setAmount('');
        setNote('');
        setDueDate('');
        setShowForm(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!personName.trim()) {
            addToast('Please enter a name', 'error');
            return;
        }
        const parsedAmount = parseFormattedNumber(amount);
        if (parsedAmount <= 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }

        const data: Omit<LedgerItem, 'id'> = {
            type: activeTab,
            personName: personName.trim(),
            amount: parsedAmount,
            note: note.trim() || undefined,
            dueDate: dueDate || undefined,
            isPaid: false,
            createdAt: Date.now()
        };

        if (editingId) {
            await db.ledger.update(editingId, data);
            addToast('Updated successfully', 'success');
        } else {
            await db.ledger.add(data);
            addToast('Added successfully', 'success');
        }
        resetForm();
    };

    const handleEdit = (item: LedgerItem) => {
        setPersonName(item.personName);
        setAmount(item.amount.toString());
        setNote(item.note || '');
        setDueDate(item.dueDate || '');
        setEditingId(item.id!);
        setActiveTab(item.type);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this entry?')) return;
        await db.ledger.delete(id);
        addToast('Deleted', 'info');
    };

    const handleTogglePaid = async (item: LedgerItem) => {
        await db.ledger.update(item.id!, {
            isPaid: !item.isPaid,
            paidAt: !item.isPaid ? Date.now() : undefined
        });
        addToast(item.isPaid ? 'Marked as unpaid' : 'Marked as paid', 'success');
    };

    const filteredItems = ledgerItems?.filter(i => i.type === activeTab) || [];
    const unpaidItems = filteredItems.filter(i => !i.isPaid);
    const paidItems = filteredItems.filter(i => i.isPaid);

    const totalReceivable = ledgerItems?.filter(i => i.type === 'receivable' && !i.isPaid).reduce((s, i) => s + i.amount, 0) || 0;
    const totalPayable = ledgerItems?.filter(i => i.type === 'payable' && !i.isPaid).reduce((s, i) => s + i.amount, 0) || 0;

    if (!ledgerItems) {
        return <div className="skeleton" style={{ height: 200 }} />;
    }

    return (
        <div className="ledger-view">
            {/* Summary Header */}
            <div className="ledger-summary">
                <div className="summary-card receivable">
                    <span className="label"><ArrowDownLeft size={14} /> To Receive</span>
                    <span className="amount">{formatCurrency(totalReceivable)}</span>
                </div>
                <div className="summary-card payable">
                    <span className="label"><ArrowUpRight size={14} /> To Pay</span>
                    <span className="amount">{formatCurrency(totalPayable)}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="ledger-tabs">
                <button
                    className={activeTab === 'receivable' ? 'active' : ''}
                    onClick={() => setActiveTab('receivable')}
                >
                    <ArrowDownLeft size={16} /> Receivables
                </button>
                <button
                    className={activeTab === 'payable' ? 'active' : ''}
                    onClick={() => setActiveTab('payable')}
                >
                    <ArrowUpRight size={16} /> Payables
                </button>
            </div>

            {/* Add Button */}
            <button className="ledger-add-btn" onClick={() => setShowForm(true)}>
                <Plus size={16} />
                Add {activeTab === 'receivable' ? 'Receivable' : 'Payable'}
            </button>

            {/* List */}
            <div className="ledger-list">
                {unpaidItems.length === 0 && paidItems.length === 0 ? (
                    <p className="empty-message">No {activeTab === 'receivable' ? 'receivables' : 'payables'} yet.</p>
                ) : (
                    <>
                        {unpaidItems.map(item => (
                            <div key={item.id} className="ledger-item">
                                <div className="item-checkbox">
                                    <button onClick={() => handleTogglePaid(item)} title="Mark as paid">
                                        <div className="checkbox"></div>
                                    </button>
                                </div>
                                <div className="item-info">
                                    <span className="person-name">{item.personName}</span>
                                    {item.note && <span className="note">{item.note}</span>}
                                    {item.dueDate && (
                                        <span className="due-date">
                                            <Calendar size={12} /> Due: {item.dueDate}
                                        </span>
                                    )}
                                </div>
                                <span className="item-amount">{formatCurrency(item.amount)}</span>
                                <div className="item-actions">
                                    <button onClick={() => handleEdit(item)}><Edit2 size={14} /></button>
                                    <button onClick={() => handleDelete(item.id!)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}

                        {paidItems.length > 0 && (
                            <>
                                <h4 className="paid-divider">Paid</h4>
                                {paidItems.map(item => (
                                    <div key={item.id} className="ledger-item paid">
                                        <div className="item-checkbox">
                                            <button onClick={() => handleTogglePaid(item)} title="Mark as unpaid">
                                                <div className="checkbox checked"><Check size={12} /></div>
                                            </button>
                                        </div>
                                        <div className="item-info">
                                            <span className="person-name">{item.personName}</span>
                                            {item.note && <span className="note">{item.note}</span>}
                                        </div>
                                        <span className="item-amount">{formatCurrency(item.amount)}</span>
                                        <div className="item-actions">
                                            <button onClick={() => handleDelete(item.id!)}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><BookOpen size={18} /> {editingId ? 'Edit' : 'Add'} {activeTab === 'receivable' ? 'Receivable' : 'Payable'}</h3>
                            <button onClick={resetForm}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <label>Name</label>
                            <input
                                type="text"
                                placeholder="Person or company name"
                                value={personName}
                                onChange={e => setPersonName(e.target.value)}
                                autoFocus
                            />

                            <label>Amount</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Amount"
                                value={amount}
                                onChange={e => setAmount(formatNumber(e.target.value))}
                            />

                            <label>Note (optional)</label>
                            <input
                                type="text"
                                placeholder="e.g., For dinner last week"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />

                            <label>Due Date (optional)</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                            />

                            <button type="submit" className="submit-btn">
                                <Check size={16} />
                                {editingId ? 'Update' : 'Add'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
