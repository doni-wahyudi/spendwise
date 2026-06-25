import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SavingsGoal } from '../db/db';
import { useToast } from '../store/useToast';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/currency';
import { Target, Plus, Trash2, PiggyBank } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function SavingsGoals() {
    const { addToast } = useToast();
    const goals = useLiveQuery(() => db.savingsGoals.toArray());

    const [showForm, setShowForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [color, setColor] = useState(COLORS[0]);

    const [contributeId, setContributeId] = useState<number | null>(null);
    const [contributeAmount, setContributeAmount] = useState('');

    const resetForm = () => {
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
        setDeadline('');
        setColor(COLORS[0]);
        setEditingGoal(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const goalData = {
            name,
            targetAmount: parseFormattedNumber(targetAmount),
            currentAmount: parseFormattedNumber(currentAmount) || 0,
            deadline: deadline || undefined,
            color,
            createdAt: Date.now()
        };

        if (editingGoal) {
            await db.savingsGoals.update(editingGoal.id, goalData);
            addToast('Goal updated!', 'success');
        } else {
            await db.savingsGoals.add(goalData);
            addToast('Goal created!', 'success');
        }

        resetForm();
    };

    const handleEdit = (goal: SavingsGoal) => {
        setEditingGoal(goal);
        setName(goal.name);
        setTargetAmount(formatNumber(goal.targetAmount.toString()));
        setCurrentAmount(formatNumber(goal.currentAmount.toString()));
        setDeadline(goal.deadline || '');
        setColor(goal.color);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this savings goal?')) {
            await db.savingsGoals.delete(id);
            addToast('Goal deleted', 'info');
        }
    };

    const handleContribute = async () => {
        if (!contributeId || !contributeAmount) return;

        const goal = goals?.find(g => g.id === contributeId);
        if (!goal) return;

        const amount = parseFormattedNumber(contributeAmount);
        await db.savingsGoals.update(contributeId, {
            currentAmount: goal.currentAmount + amount
        });

        addToast(`Added ${formatCurrency(amount)} to ${goal.name}!`, 'success');
        setContributeId(null);
        setContributeAmount('');
    };

    const getProgress = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100);
    };

    const getDaysRemaining = (deadline: string | undefined) => {
        if (!deadline) return null;
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getProgressStatus = (goal: SavingsGoal) => {
        const progress = getProgress(goal.currentAmount, goal.targetAmount);
        const daysLeft = getDaysRemaining(goal.deadline);

        if (progress >= 100) return 'completed';
        if (daysLeft !== null && daysLeft < 0) return 'overdue';
        if (daysLeft !== null && daysLeft <= 7) return 'urgent';
        return 'on-track';
    };

    if (!goals) {
        return <div className="skeleton" style={{ height: 150 }} />;
    }

    // Calculate totals for overview
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return (
        <section className="settings-section savings-goals">
            <div className="section-header">
                <h3><Target size={18} /> Savings Goals</h3>
                <button onClick={() => setShowForm(!showForm)} className="add-btn">
                    <Plus size={16} />
                </button>
            </div>

            {/* Goals Overview Chart */}
            {goals.length > 0 && (
                <div className="goals-overview">
                    <div className="overview-stats">
                        <div className="stat">
                            <span className="stat-value">{formatCurrency(totalSaved)}</span>
                            <span className="stat-label">of {formatCurrency(totalTarget)}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{overallProgress.toFixed(0)}%</span>
                            <span className="stat-label">Overall</span>
                        </div>
                    </div>
                    <div className="goals-mini-chart">
                        {goals.map(goal => {
                            const progress = getProgress(goal.currentAmount, goal.targetAmount);
                            const status = getProgressStatus(goal);
                            return (
                                <div key={goal.id} className={`mini-bar ${status}`} title={goal.name}>
                                    <div
                                        className="mini-bar-fill"
                                        style={{
                                            height: `${progress}%`,
                                            backgroundColor: goal.color
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="goal-form">
                    <input
                        type="text"
                        placeholder="Goal name (e.g., Vacation)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <div className="form-row two-col">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Target amount"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(formatNumber(e.target.value.replace(/\D/g, '')))}
                            required
                        />
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Current saved"
                            value={currentAmount}
                            onChange={(e) => setCurrentAmount(formatNumber(e.target.value.replace(/\D/g, '')))}
                        />
                    </div>
                    <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        placeholder="Deadline (optional)"
                    />
                    <div className="color-picker">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                className={`color-btn ${color === c ? 'active' : ''}`}
                                style={{ backgroundColor: c }}
                                onClick={() => setColor(c)}
                            />
                        ))}
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={resetForm} className="cancel-btn">Cancel</button>
                        <button type="submit" className="submit-btn">
                            {editingGoal ? 'Update' : 'Add Goal'}
                        </button>
                    </div>
                </form>
            )}

            {goals.length === 0 ? (
                <p className="empty-message">No savings goals yet.</p>
            ) : (
                <ul className="goals-list">
                    {goals.map(goal => {
                        const progress = getProgress(goal.currentAmount, goal.targetAmount);
                        const remaining = goal.targetAmount - goal.currentAmount;

                        return (
                            <li key={goal.id} className="goal-item">
                                <div className="goal-header">
                                    <span className="goal-icon" style={{ backgroundColor: goal.color }}>
                                        <PiggyBank size={16} />
                                    </span>
                                    <div className="goal-info">
                                        <span className="goal-name">{goal.name}</span>
                                        <span className="goal-amounts">
                                            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                                        </span>
                                    </div>
                                    <div className="goal-actions">
                                        <button onClick={() => setContributeId(goal.id)} title="Add funds">
                                            <Plus size={14} />
                                        </button>
                                        <button onClick={() => handleEdit(goal)} title="Edit">✏️</button>
                                        <button onClick={() => handleDelete(goal.id)} title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="goal-progress">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${progress}%`,
                                            backgroundColor: goal.color
                                        }}
                                    />
                                </div>

                                <div className="goal-footer">
                                    <span className="progress-text">{progress.toFixed(0)}%</span>
                                    {remaining > 0 && (
                                        <span className="remaining">{formatCurrency(remaining)} to go</span>
                                    )}
                                    {progress >= 100 && (
                                        <span className="completed">🎉 Goal reached!</span>
                                    )}
                                    {goal.deadline && progress < 100 && (() => {
                                        const days = getDaysRemaining(goal.deadline);
                                        if (days === null) return null;
                                        if (days < 0) return <span className="days-overdue">⚠️ {Math.abs(days)}d overdue</span>;
                                        if (days <= 7) return <span className="days-urgent">⏰ {days}d left</span>;
                                        return <span className="days-remaining">📅 {days}d left</span>;
                                    })()}
                                </div>

                                {contributeId === goal.id && (
                                    <div className="contribute-form">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Amount to add"
                                            value={contributeAmount}
                                            onChange={(e) => setContributeAmount(formatNumber(e.target.value.replace(/\D/g, '')))}
                                            autoFocus
                                        />
                                        <button onClick={handleContribute} className="contribute-btn">Add</button>
                                        <button onClick={() => setContributeId(null)} className="cancel-btn">×</button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
