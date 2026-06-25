import { useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Pie, Bar } from 'react-chartjs-2';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { PieChart, BarChart3 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

type ChartType = 'doughnut' | 'pie' | 'bar';

export default function SummaryChart() {
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());
    const { dateRange } = useStore();

    const [chartType, setChartType] = useState<ChartType>('doughnut');

    const data = useMemo(() => {
        if (!transactions || !categories) return null;

        // Filter by date range
        const expenses = transactions.filter(
            t => t.type === 'expense' && t.date >= dateRange.startDate && t.date <= dateRange.endDate
        );

        const categoryTotals: Record<number, number> = {};

        expenses.forEach(tx => {
            categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
        });

        // Sort by total amount
        const sortedCatIds = Object.keys(categoryTotals).sort((a, b) => categoryTotals[parseInt(b)] - categoryTotals[parseInt(a)]);

        const labels = sortedCatIds.map(id => categories.find(c => c.id === parseInt(id))?.name || 'Unknown');
        const values = sortedCatIds.map(id => categoryTotals[parseInt(id)]);
        const bgColors = sortedCatIds.map(id => categories.find(c => c.id === parseInt(id))?.color || '#ccc');

        return {
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: bgColors,
                    borderWidth: 1,
                    borderRadius: chartType === 'bar' ? 6 : 0,
                },
            ],
        };
    }, [transactions, categories, dateRange, chartType]);

    if (!data || data.datasets[0].data.length === 0) {
        return (
            <div className="chart-placeholder">
                <p>No expenses in this period.</p>
            </div>
        );
    }

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#a1a1aa' }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#a1a1aa', font: { size: 11 } }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false
    };

    return (
        <div className="summary-chart">
            <div className="chart-header">
                <h3>Spending Breakdown</h3>
                <div className="chart-type-toggle">
                    <button
                        className={chartType === 'doughnut' || chartType === 'pie' ? 'active' : ''}
                        onClick={() => setChartType(chartType === 'doughnut' ? 'pie' : 'doughnut')}
                        title="Pie Chart"
                    >
                        <PieChart size={16} />
                    </button>
                    <button
                        className={chartType === 'bar' ? 'active' : ''}
                        onClick={() => setChartType('bar')}
                        title="Bar Chart"
                    >
                        <BarChart3 size={16} />
                    </button>
                </div>
            </div>
            <div className="chart-container" style={{ height: chartType === 'bar' ? 200 : 'auto' }}>
                {chartType === 'doughnut' && <Doughnut data={data} options={pieOptions} />}
                {chartType === 'pie' && <Pie data={data} options={pieOptions} />}
                {chartType === 'bar' && <Bar data={data} options={barOptions} />}
            </div>
            <div className="heavy-spot-alert">
                <strong>Heavy Spot:</strong> {data.labels[0]} ({Math.round(data.datasets[0].data[0] / data.datasets[0].data.reduce((a, b) => a + b, 0) * 100)}%)
            </div>
        </div>
    );
}
