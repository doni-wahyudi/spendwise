import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useStore } from '../store/useStore';

export default function SummaryCards() {
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const { dateRange, dateFilterType } = useStore();

    const summary = useMemo(() => {
        if (!transactions) return { income: 0, expense: 0, balance: 0 };

        // Filter transactions by date range
        const filtered = transactions.filter(
            tx => tx.date >= dateRange.startDate && tx.date <= dateRange.endDate
        );

        const income = filtered
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = filtered
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expense,
            balance: income - expense
        };
    }, [transactions, dateRange]);

    // Get period label
    const getPeriodLabel = () => {
        if (dateFilterType === 'all') return 'All Time';
        if (dateFilterType === 'custom') return 'Custom Period';

        const start = new Date(dateRange.startDate + 'T00:00:00');
        const end = new Date(dateRange.endDate + 'T00:00:00');

        // If same month, show just the month name
        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
            return start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        }

        // Otherwise show range
        return `${start.toLocaleDateString('id-ID', { month: 'short' })} - ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
    };

    if (!transactions) {
        return (
            <div className="summary-cards">
                <div className="summary-card skeleton" />
                <div className="summary-card skeleton" />
                <div className="summary-card skeleton" />
            </div>
        );
    }

    return (
        <>
            <div className="summary-period">{getPeriodLabel()}</div>
            <div className="summary-cards">
                <div className="summary-card income">
                    <div className="card-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-label">Income</span>
                        <span className="card-value">{formatCurrency(summary.income)}</span>
                    </div>
                </div>

                <div className="summary-card expense">
                    <div className="card-icon">
                        <TrendingDown size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-label">Expense</span>
                        <span className="card-value">{formatCurrency(summary.expense)}</span>
                    </div>
                </div>

                <div className={`summary-card balance ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
                    <div className="card-icon">
                        <Wallet size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-label">Balance</span>
                        <span className="card-value">{formatCurrency(summary.balance)}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
