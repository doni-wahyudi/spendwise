import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bar } from 'react-chartjs-2';
import { db } from '../db/db';
import { formatCurrency } from '../utils/currency';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

export default function CategoryComparison() {
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const [monthOffset, setMonthOffset] = useState(0);

    const { chartData, months, categoryTotals } = useMemo(() => {
        if (!transactions || !categories) {
            return { chartData: null, months: [], categoryTotals: [] };
        }

        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset - 1, 1);

        const formatMonth = (d: Date) => d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const currentKey = getMonthKey(currentMonth);
        const prevKey = getMonthKey(prevMonth);

        // Get expense categories only
        const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

        // Calculate totals per category per month
        const totals: Record<number, { current: number; prev: number }> = {};

        expenseCategories.forEach(cat => {
            totals[cat.id] = { current: 0, prev: 0 };
        });

        transactions
            .filter(tx => tx.type === 'expense')
            .forEach(tx => {
                if (tx.date.startsWith(currentKey)) {
                    if (totals[tx.categoryId]) totals[tx.categoryId].current += tx.amount;
                } else if (tx.date.startsWith(prevKey)) {
                    if (totals[tx.categoryId]) totals[tx.categoryId].prev += tx.amount;
                }
            });

        // Sort by current month spending
        const sortedCategories = expenseCategories
            .filter(c => totals[c.id].current > 0 || totals[c.id].prev > 0)
            .sort((a, b) => totals[b.id].current - totals[a.id].current)
            .slice(0, 6);

        const labels = sortedCategories.map(c => c.name);
        const currentData = sortedCategories.map(c => totals[c.id].current);
        const prevData = sortedCategories.map(c => totals[c.id].prev);
        const colors = sortedCategories.map(c => c.color);

        return {
            chartData: {
                labels,
                datasets: [
                    {
                        label: formatMonth(currentMonth),
                        data: currentData,
                        backgroundColor: colors.map(c => c + 'dd'),
                        borderRadius: 6
                    },
                    {
                        label: formatMonth(prevMonth),
                        data: prevData,
                        backgroundColor: colors.map(c => c + '66'),
                        borderRadius: 6
                    }
                ]
            },
            months: [formatMonth(currentMonth), formatMonth(prevMonth)],
            categoryTotals: sortedCategories.map((c, i) => ({
                name: c.name,
                current: currentData[i],
                prev: prevData[i],
                change: prevData[i] > 0 ? ((currentData[i] - prevData[i]) / prevData[i]) * 100 : 0
            }))
        };
    }, [transactions, categories, monthOffset]);

    if (!chartData) {
        return <div className="skeleton" style={{ height: 200 }} />;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#a1a1aa', font: { size: 11 } }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#a1a1aa', font: { size: 10 } }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: {
                    color: '#a1a1aa',
                    callback: (value: string | number) => formatCurrency(Number(value))
                }
            }
        }
    };

    return (
        <div className="category-comparison">
            <div className="comparison-header">
                <h3><BarChart3 size={16} /> Category Comparison</h3>
                <div className="month-nav">
                    <button onClick={() => setMonthOffset(o => o + 1)}>
                        <ChevronLeft size={16} />
                    </button>
                    <span>{months[0]} vs {months[1]}</span>
                    <button onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="chart-container" style={{ height: 200 }}>
                <Bar data={chartData} options={options} />
            </div>

            <div className="comparison-details">
                {categoryTotals.map((cat, i) => (
                    <div key={i} className="comparison-row">
                        <span className="cat-name">{cat.name}</span>
                        <span className={`change ${cat.change > 0 ? 'up' : cat.change < 0 ? 'down' : ''}`}>
                            {cat.change > 0 ? '↑' : cat.change < 0 ? '↓' : '→'}
                            {Math.abs(cat.change).toFixed(0)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
