import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { formatCurrency } from '../utils/currency';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function BudgetForecast() {
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const forecast = useMemo(() => {
        if (!transactions || !categories) return null;

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dayOfMonth = now.getDate();
        const daysRemaining = daysInMonth - dayOfMonth;

        // Get this month's expenses
        const monthExpenses = transactions.filter(
            tx => tx.type === 'expense' && tx.date.startsWith(currentMonth)
        );

        const totalSpent = monthExpenses.reduce((sum, tx) => sum + tx.amount, 0);

        // Calculate daily average and projected spending
        const dailyAverage = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
        const projectedTotal = totalSpent + (dailyAverage * daysRemaining);

        // Get total budget from categories
        const totalBudget = categories
            .filter(c => c.budgetLimit && c.budgetLimit > 0)
            .reduce((sum, c) => sum + (c.budgetLimit || 0), 0);

        // Calculate spending by category with budgets
        const categoryForecasts = categories
            .filter(c => c.budgetLimit && c.budgetLimit > 0)
            .map(cat => {
                const spent = monthExpenses
                    .filter(tx => tx.categoryId === cat.id)
                    .reduce((sum, tx) => sum + tx.amount, 0);

                const projected = spent + ((spent / Math.max(dayOfMonth, 1)) * daysRemaining);
                const percentUsed = (spent / cat.budgetLimit!) * 100;
                const projectedPercent = (projected / cat.budgetLimit!) * 100;

                return {
                    name: cat.name,
                    color: cat.color,
                    budget: cat.budgetLimit!,
                    spent,
                    projected,
                    percentUsed,
                    projectedPercent,
                    willExceed: projected > cat.budgetLimit!
                };
            })
            .sort((a, b) => b.projectedPercent - a.projectedPercent);

        const willExceedBudget = totalBudget > 0 && projectedTotal > totalBudget;
        const budgetRemaining = totalBudget - totalSpent;
        const safeDaily = daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;

        return {
            totalSpent,
            projectedTotal,
            totalBudget,
            dailyAverage,
            safeDaily,
            daysRemaining,
            willExceedBudget,
            categoryForecasts,
            percentComplete: (dayOfMonth / daysInMonth) * 100
        };
    }, [transactions, categories]);

    if (!forecast) {
        return <div className="skeleton" style={{ height: 150 }} />;
    }

    if (forecast.totalBudget === 0) {
        return (
            <div className="budget-forecast no-budget">
                <h3><TrendingUp size={16} /> Budget Forecast</h3>
                <p className="empty-message">Set category budgets in Settings to see forecasts.</p>
            </div>
        );
    }

    return (
        <div className="budget-forecast">
            <h3><TrendingUp size={16} /> Budget Forecast</h3>

            <div className="forecast-summary">
                <div className="forecast-card">
                    <span className="label">Spent So Far</span>
                    <span className="value">{formatCurrency(forecast.totalSpent)}</span>
                </div>
                <div className="forecast-card">
                    <span className="label">Projected Total</span>
                    <span className={`value ${forecast.willExceedBudget ? 'danger' : ''}`}>
                        {formatCurrency(forecast.projectedTotal)}
                    </span>
                </div>
                <div className="forecast-card">
                    <span className="label">Budget</span>
                    <span className="value">{formatCurrency(forecast.totalBudget)}</span>
                </div>
            </div>

            <div className={`forecast-status ${forecast.willExceedBudget ? 'warning' : 'ok'}`}>
                {forecast.willExceedBudget ? (
                    <>
                        <AlertTriangle size={16} />
                        <span>On track to exceed budget by {formatCurrency(forecast.projectedTotal - forecast.totalBudget)}</span>
                    </>
                ) : (
                    <>
                        <CheckCircle size={16} />
                        <span>On track! Safe to spend {formatCurrency(forecast.safeDaily)}/day</span>
                    </>
                )}
            </div>

            {forecast.categoryForecasts.length > 0 && (
                <div className="category-forecasts">
                    {forecast.categoryForecasts.slice(0, 4).map((cat, i) => (
                        <div key={i} className="cat-forecast">
                            <div className="cat-forecast-header">
                                <span className="cat-name" style={{ color: cat.color }}>{cat.name}</span>
                                <span className={`cat-status ${cat.willExceed ? 'exceed' : ''}`}>
                                    {cat.willExceed ? '⚠️' : '✓'} {cat.projectedPercent.toFixed(0)}%
                                </span>
                            </div>
                            <div className="cat-forecast-bar">
                                <div
                                    className="bar-spent"
                                    style={{
                                        width: `${Math.min(cat.percentUsed, 100)}%`,
                                        backgroundColor: cat.color
                                    }}
                                />
                                <div
                                    className="bar-projected"
                                    style={{
                                        width: `${Math.min(cat.projectedPercent - cat.percentUsed, 100 - cat.percentUsed)}%`,
                                        backgroundColor: cat.color,
                                        opacity: 0.3
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
