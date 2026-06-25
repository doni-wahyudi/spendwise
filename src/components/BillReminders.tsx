import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type BillReminder } from '../db/db';
import { useToast } from '../store/useToast';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/currency';
import { Bell, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function BillReminders() {
    const { addToast } = useToast();
    const bills = useLiveQuery(() => db.billReminders.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const [showForm, setShowForm] = useState(false);
    const [editingBill, setEditingBill] = useState<BillReminder | null>(null);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDay, setDueDay] = useState('1');
    const [categoryId, setCategoryId] = useState('');
    const [isActive, setIsActive] = useState(true);

    const today = new Date().getDate();

    const resetForm = () => {
        setName('');
        setAmount('');
        setDueDay('1');
        setCategoryId('');
        setIsActive(true);
        setEditingBill(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const billData = {
            name,
            amount: parseFormattedNumber(amount),
            dueDay: parseInt(dueDay),
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            isActive
        };

        if (editingBill) {
            await db.billReminders.update(editingBill.id, billData);
            addToast('Bill updated!', 'success');
        } else {
            await db.billReminders.add(billData);
            addToast('Bill reminder added!', 'success');
        }

        resetForm();
    };

    const handleEdit = (bill: BillReminder) => {
        setEditingBill(bill);
        setName(bill.name);
        setAmount(formatNumber(bill.amount.toString()));
        setDueDay(bill.dueDay.toString());
        setCategoryId(bill.categoryId?.toString() || '');
        setIsActive(bill.isActive);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this bill reminder?')) {
            await db.billReminders.delete(id);
            addToast('Bill deleted', 'info');
        }
    };

    const toggleActive = async (bill: BillReminder) => {
        await db.billReminders.update(bill.id, { isActive: !bill.isActive });
    };

    const getDueStatus = (dueDay: number) => {
        const diff = dueDay - today;
        if (diff < 0) return { status: 'overdue', label: 'Overdue', color: '#ef4444' };
        if (diff === 0) return { status: 'today', label: 'Due Today', color: '#f59e0b' };
        if (diff <= 3) return { status: 'soon', label: `Due in ${diff} days`, color: '#f59e0b' };
        return { status: 'ok', label: `Due on ${dueDay}`, color: '#10b981' };
    };

    const getCategoryName = (id?: number) => {
        if (!id) return null;
        return categories?.find(c => c.id === id)?.name;
    };

    if (!bills) {
        return <div className="skeleton" style={{ height: 150 }} />;
    }

    // Sort: overdue first, then by due day
    const sortedBills = [...bills].sort((a, b) => {
        const aStatus = getDueStatus(a.dueDay);
        const bStatus = getDueStatus(b.dueDay);
        if (aStatus.status === 'overdue' && bStatus.status !== 'overdue') return -1;
        if (bStatus.status === 'overdue' && aStatus.status !== 'overdue') return 1;
        return a.dueDay - b.dueDay;
    });

    return (
        <section className="settings-section bill-reminders">
            <div className="section-header">
                <h3><Bell size={18} /> Bill Reminders</h3>
                <button onClick={() => setShowForm(!showForm)} className="add-btn">
                    <Plus size={16} />
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bill-form">
                    <input
                        type="text"
                        placeholder="Bill name (e.g., Netflix)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <div className="form-row two-col">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(formatNumber(e.target.value.replace(/\D/g, '')))}
                            required
                        />
                        <select
                            value={dueDay}
                            onChange={(e) => setDueDay(e.target.value)}
                        >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <option key={day} value={day}>Day {day}</option>
                            ))}
                        </select>
                    </div>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >
                        <option value="">No category</option>
                        {categories?.filter(c => c.type === 'expense' || c.type === 'both').map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <div className="form-actions">
                        <button type="button" onClick={resetForm} className="cancel-btn">Cancel</button>
                        <button type="submit" className="submit-btn">
                            {editingBill ? 'Update' : 'Add Reminder'}
                        </button>
                    </div>
                </form>
            )}

            {bills.length === 0 ? (
                <p className="empty-message">No bill reminders yet.</p>
            ) : (
                <ul className="bills-list">
                    {sortedBills.map(bill => {
                        const dueStatus = getDueStatus(bill.dueDay);
                        const catName = getCategoryName(bill.categoryId);

                        return (
                            <li key={bill.id} className={`bill-item ${!bill.isActive ? 'inactive' : ''}`}>
                                <div className="bill-status">
                                    {dueStatus.status === 'overdue' || dueStatus.status === 'today' ? (
                                        <AlertTriangle size={18} style={{ color: dueStatus.color }} />
                                    ) : (
                                        <CheckCircle size={18} style={{ color: dueStatus.color }} />
                                    )}
                                </div>
                                <div className="bill-info">
                                    <span className="bill-name">{bill.name}</span>
                                    <span className="bill-meta">
                                        {formatCurrency(bill.amount)}
                                        {catName && ` • ${catName}`}
                                    </span>
                                </div>
                                <div className="bill-due" style={{ color: dueStatus.color }}>
                                    {dueStatus.label}
                                </div>
                                <div className="bill-actions">
                                    <button onClick={() => toggleActive(bill)} title="Toggle">
                                        {bill.isActive ? '✓' : '○'}
                                    </button>
                                    <button onClick={() => handleEdit(bill)} title="Edit">✏️</button>
                                    <button onClick={() => handleDelete(bill.id)} title="Delete">
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
