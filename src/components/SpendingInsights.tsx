import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { formatCurrency } from '../utils/currency';
import { TrendingUp, TrendingDown, AlertCircle, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';

interface Insight {
    type: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    message: string;
}

export default function SpendingInsights() {
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const insights = useMemo<Insight[]>(() => {
        if (!transactions || !categories || transactions.length < 2) return [];

        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonth = now.getMonth() === 0
            ? `${now.getFullYear() - 1}-12`
            : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

        // Get transactions for this and last month
        const thisMonthTxs = transactions.filter(tx => tx.date.startsWith(thisMonth));
        const lastMonthTxs = transactions.filter(tx => tx.date.startsWith(lastMonth));

        const thisMonthExpense = thisMonthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
        const lastMonthExpense = lastMonthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

        const thisMonthIncome = thisMonthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);

        const result: Insight[] = [];

        // Expense comparison
        if (lastMonthExpense > 0) {
            const expenseChange = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
            if (Math.abs(expenseChange) >= 10) {
                if (expenseChange > 0) {
                    result.push({
                        type: 'negative',
                        icon: <ArrowUp size={16} />,
                        message: `Spending up ${expenseChange.toFixed(0)}% vs last month`
                    });
                } else {
                    result.push({
                        type: 'positive',
                        icon: <ArrowDown size={16} />,
                        message: `Spending down ${Math.abs(expenseChange).toFixed(0)}% vs last month`
                    });
                }
            }
        }

        // Top spending category this month
        const categorySpending: Record<number, number> = {};
        thisMonthTxs.filter(tx => tx.type === 'expense').forEach(tx => {
            categorySpending[tx.categoryId] = (categorySpending[tx.categoryId] || 0) + tx.amount;
        });

        const topCategoryId = Object.entries(categorySpending)
            .sort(([, a], [, b]) => b - a)[0]?.[0];

        if (topCategoryId) {
            const category = categories.find(c => c.id === parseInt(topCategoryId));
            const amount = categorySpending[parseInt(topCategoryId)];
            if (category) {
                result.push({
                    type: 'neutral',
                    icon: <AlertCircle size={16} />,
                    message: `Biggest spend: ${category.name} (${formatCurrency(amount)})`
                });
            }
        }

        // Savings rate
        if (thisMonthIncome > 0) {
            const savingsRate = ((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100;
            if (savingsRate >= 20) {
                result.push({
                    type: 'positive',
                    icon: <TrendingUp size={16} />,
                    message: `Great! Saving ${savingsRate.toFixed(0)}% of income`
                });
            } else if (savingsRate < 0) {
                result.push({
                    type: 'negative',
                    icon: <TrendingDown size={16} />,
                    message: `Spending exceeds income by ${formatCurrency(Math.abs(thisMonthIncome - thisMonthExpense))}`
                });
            }
        }

        // Unusual spending detection
        const avgDailySpend = lastMonthExpense / 30;
        const daysInMonth = now.getDate();
        const projectedSpend = (thisMonthExpense / daysInMonth) * 30;

        if (avgDailySpend > 0 && projectedSpend > lastMonthExpense * 1.3) {
            result.push({
                type: 'negative',
                icon: <AlertCircle size={16} />,
                message: `On track to exceed last month by ${((projectedSpend / lastMonthExpense - 1) * 100).toFixed(0)}%`
            });
        }

        return result.slice(0, 3); // Max 3 insights
    }, [transactions, categories]);

    if (!transactions || !categories) {
        return null;
    }

    if (transactions.length < 5 || insights.length === 0) {
        return null; // Not enough data for meaningful insights
    }

    return (
        <div className="spending-insights">
            <h3>
                <Sparkles size={16} style={{ marginRight: 6 }} />
                Insights
            </h3>
            <ul className="insights-list">
                {insights.map((insight, i) => (
                    <li key={i} className={`insight-item ${insight.type}`}>
                        <span className="insight-icon">{insight.icon}</span>
                        <span className="insight-message">{insight.message}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
