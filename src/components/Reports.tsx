import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

type ReportPeriod = 'monthly' | 'yearly';

interface MonthData {
    month: string;
    income: number;
    expense: number;
    balance: number;
    categories: Record<number, number>;
}

export default function Reports() {
    const [period, setPeriod] = useState<ReportPeriod>('monthly');
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const reportData = useMemo(() => {
        if (!transactions) return [];

        const dataMap: Record<string, MonthData> = {};

        transactions.forEach(tx => {
            const key = period === 'monthly'
                ? tx.date.substring(0, 7)
                : tx.date.substring(0, 4);

            if (!dataMap[key]) {
                dataMap[key] = {
                    month: key,
                    income: 0,
                    expense: 0,
                    balance: 0,
                    categories: {}
                };
            }

            if (tx.type === 'income') {
                dataMap[key].income += tx.amount;
            } else {
                dataMap[key].expense += tx.amount;
                dataMap[key].categories[tx.categoryId] =
                    (dataMap[key].categories[tx.categoryId] || 0) + tx.amount;
            }
            dataMap[key].balance = dataMap[key].income - dataMap[key].expense;
        });

        return Object.values(dataMap).sort((a, b) => b.month.localeCompare(a.month));
    }, [transactions, period]);

    const formatPeriodLabel = (key: string) => {
        if (period === 'yearly') {
            return key;
        }
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    const getCategoryName = (id: number) => {
        return categories?.find(c => c.id === id)?.name || 'Unknown';
    };

    const getCategoryColor = (id: number) => {
        return categories?.find(c => c.id === id)?.color || '#6366f1';
    };

    // Summary totals
    const totals = useMemo(() => {
        return reportData.reduce((acc, item) => ({
            income: acc.income + item.income,
            expense: acc.expense + item.expense,
            balance: acc.balance + item.balance
        }), { income: 0, expense: 0, balance: 0 });
    }, [reportData]);

    if (!transactions || !categories) {
        return (
            <section className="settings-section">
                <h3><FileText size={18} /> Reports</h3>
                <div className="skeleton" style={{ height: 200 }} />
            </section>
        );
    }

    return (
        <section className="settings-section reports-section">
            <div className="section-header">
                <h3>
                    <FileText size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Reports
                </h3>
                <div className="period-toggle">
                    <button
                        className={period === 'monthly' ? 'active' : ''}
                        onClick={() => setPeriod('monthly')}
                    >
                        Monthly
                    </button>
                    <button
                        className={period === 'yearly' ? 'active' : ''}
                        onClick={() => setPeriod('yearly')}
                    >
                        Yearly
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="report-summary">
                <div className="summary-item">
                    <span className="label">Total Income</span>
                    <span className="value income">+{formatCurrency(totals.income)}</span>
                </div>
                <div className="summary-item">
                    <span className="label">Total Expense</span>
                    <span className="value expense">-{formatCurrency(totals.expense)}</span>
                </div>
                <div className="summary-item">
                    <span className="label">Net Balance</span>
                    <span className={`value ${totals.balance >= 0 ? 'income' : 'expense'}`}>
                        {formatCurrency(totals.balance)}
                    </span>
                </div>
            </div>

            {/* Period List */}
            {reportData.length === 0 ? (
                <p className="empty-message">No data available.</p>
            ) : (
                <ul className="report-list">
                    {reportData.map(item => (
                        <li key={item.month} className="report-item">
                            <button
                                className="report-header"
                                onClick={() => setExpandedMonth(
                                    expandedMonth === item.month ? null : item.month
                                )}
                            >
                                <span className="period-label">{formatPeriodLabel(item.month)}</span>
                                <div className="report-amounts">
                                    <span className="income">+{formatCurrency(item.income)}</span>
                                    <span className="expense">-{formatCurrency(item.expense)}</span>
                                    {expandedMonth === item.month ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </button>

                            {expandedMonth === item.month && (
                                <div className="report-detail">
                                    <h5>Top Expenses</h5>
                                    {Object.entries(item.categories)
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 5)
                                        .map(([catId, amount]) => (
                                            <div key={catId} className="category-row">
                                                <span
                                                    className="cat-dot"
                                                    style={{ backgroundColor: getCategoryColor(parseInt(catId)) }}
                                                />
                                                <span className="cat-name">{getCategoryName(parseInt(catId))}</span>
                                                <span className="cat-amount">{formatCurrency(amount)}</span>
                                            </div>
                                        ))
                                    }
                                    {Object.keys(item.categories).length === 0 && (
                                        <p className="empty-message">No expenses this period.</p>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
