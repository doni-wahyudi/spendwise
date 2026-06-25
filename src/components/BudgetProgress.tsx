import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { formatCurrency } from '../utils/currency';
import { useStore } from '../store/useStore';

export default function BudgetProgress() {
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());
    const { dateRange } = useStore();

    const budgetData = useMemo(() => {
        if (!transactions || !categories) return [];

        // Filter transactions by date range for expenses only
        const monthlyExpenses = transactions.filter(
            tx => tx.type === 'expense' && tx.date >= dateRange.startDate && tx.date <= dateRange.endDate
        );

        // Calculate spending per category
        const categorySpending: Record<number, number> = {};
        monthlyExpenses.forEach(tx => {
            categorySpending[tx.categoryId] = (categorySpending[tx.categoryId] || 0) + tx.amount;
        });

        // Get categories with budget limits
        return categories
            .filter(c => c.budgetLimit && c.budgetLimit > 0)
            .map(cat => {
                const spent = categorySpending[cat.id] || 0;
                const percentage = Math.min((spent / cat.budgetLimit!) * 100, 100);
                const isWarning = percentage >= 80;
                const isOver = spent > cat.budgetLimit!;

                return {
                    id: cat.id,
                    name: cat.name,
                    color: cat.color,
                    budgetLimit: cat.budgetLimit!,
                    spent,
                    percentage,
                    isWarning,
                    isOver
                };
            })
            .sort((a, b) => b.percentage - a.percentage);
    }, [transactions, categories, dateRange]);

    if (budgetData.length === 0) {
        return null;
    }

    return (
        <div className="budget-progress-section">
            <h3>Budget Progress</h3>
            <div className="budget-list">
                {budgetData.map(budget => (
                    <div key={budget.id} className={`budget-item ${budget.isWarning ? 'warning' : ''} ${budget.isOver ? 'over' : ''}`}>
                        <div className="budget-header">
                            <span className="budget-name" style={{ color: budget.color }}>{budget.name}</span>
                            <span className="budget-amount">
                                {formatCurrency(budget.spent)} / {formatCurrency(budget.budgetLimit)}
                            </span>
                        </div>
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${budget.percentage}%`,
                                    backgroundColor: budget.isOver ? 'var(--danger)' : budget.isWarning ? '#fbbf24' : budget.color
                                }}
                            />
                        </div>
                        {budget.isOver && (
                            <span className="budget-warning-text">Over budget by {formatCurrency(budget.spent - budget.budgetLimit)}</span>
                        )}
                        {budget.isWarning && !budget.isOver && (
                            <span className="budget-warning-text">{Math.round(budget.percentage)}% used</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
