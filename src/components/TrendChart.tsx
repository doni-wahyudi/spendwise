import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { t } from '../i18n/translations';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function TrendChart() {
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const { dateRange, language } = useStore();

    const chartData = useMemo(() => {
        if (!transactions) return null;

        // Filter by date range
        const filtered = transactions.filter(
            tx => tx.date >= dateRange.startDate && tx.date <= dateRange.endDate
        );

        // Group by month
        const monthlyData: Record<string, { income: number; expense: number }> = {};

        filtered.forEach(tx => {
            const month = tx.date.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
                monthlyData[month] = { income: 0, expense: 0 };
            }
            if (tx.type === 'income') {
                monthlyData[month].income += tx.amount;
            } else {
                monthlyData[month].expense += tx.amount;
            }
        });

        // Sort months
        const sortedMonths = Object.keys(monthlyData).sort();

        // Format labels
        const labels = sortedMonths.map(m => {
            const [year, month] = m.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        });

        const incomeData = sortedMonths.map(m => monthlyData[m].income);
        const expenseData = sortedMonths.map(m => monthlyData[m].expense);
        const balanceData = sortedMonths.map(m => monthlyData[m].income - monthlyData[m].expense);

        return { labels, incomeData, expenseData, balanceData, sortedMonths };
    }, [transactions, dateRange]);

    if (!chartData || chartData.sortedMonths.length === 0) {
        return null;
    }

    const barData = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Income',
                data: chartData.incomeData,
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderRadius: 4,
            },
            {
                label: 'Expense',
                data: chartData.expenseData,
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderRadius: 4,
            },
        ],
    };

    const lineData = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Balance Trend',
                data: chartData.balanceData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#a1a1aa',
                    boxWidth: 12,
                }
            },
        },
        scales: {
            x: {
                ticks: { color: '#a1a1aa' },
                grid: { color: 'rgba(255,255,255,0.05)' },
            },
            y: {
                ticks: {
                    color: '#a1a1aa',
                    callback: function (value: string | number) {
                        const num = typeof value === 'number' ? value : parseFloat(value);
                        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
                        return value;
                    }
                },
                grid: { color: 'rgba(255,255,255,0.05)' },
            },
        },
    };

    return (
        <div className="trend-charts">
            <div className="chart-section">
                <h4>{t(language, 'incomeVsExpense')}</h4>
                <div className="chart-wrapper">
                    <Bar data={barData} options={options} />
                </div>
            </div>

            <div className="chart-section">
                <h4>{t(language, 'balanceTrend')}</h4>
                <div className="chart-wrapper">
                    <Line data={lineData} options={options} />
                </div>
            </div>
        </div>
    );
}
