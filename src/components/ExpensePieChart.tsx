import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import { PieChart, Table } from 'lucide-react';
import CategorySpendingTable from './CategorySpendingTable';

export default function ExpensePieChart() {
    const { dateRange } = useStore();
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

    const chartData = useMemo(() => {
        if (!transactions || !categories) return [];

        // Filter expenses within date range
        const expenses = transactions.filter(
            tx => tx.type === 'expense' &&
                tx.date >= dateRange.startDate &&
                tx.date <= dateRange.endDate
        );

        // Group by category
        const categoryTotals: Record<number, number> = {};
        expenses.forEach(tx => {
            categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
        });

        // Convert to chart data with category info
        const data = Object.entries(categoryTotals)
            .map(([catId, amount]) => {
                const category = categories.find(c => c.id === Number(catId));
                return {
                    id: Number(catId),
                    name: category?.name || 'Unknown',
                    color: category?.color || '#6b7280',
                    amount,
                    percentage: 0
                };
            })
            .sort((a, b) => b.amount - a.amount);

        // Calculate percentages
        const total = data.reduce((sum, d) => sum + d.amount, 0);
        data.forEach(d => {
            d.percentage = total > 0 ? (d.amount / total) * 100 : 0;
        });

        return data;
    }, [transactions, categories, dateRange]);

    const total = chartData.reduce((sum, d) => sum + d.amount, 0);

    // Generate SVG pie chart
    const generatePieSlices = () => {
        if (chartData.length === 0) return null;

        if (chartData.length === 1 || chartData[0].percentage >= 99.9) {
            return (
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill={chartData[0].color}
                    className="pie-slice"
                />
            );
        }

        let cumulativePercentage = 0;
        const slices = chartData.map((segment, index) => {
            const startAngle = (cumulativePercentage / 100) * 360;
            cumulativePercentage += segment.percentage;
            const endAngle = (cumulativePercentage / 100) * 360;

            // Convert to radians
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);

            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);

            const largeArc = segment.percentage > 50 ? 1 : 0;

            const pathD = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

            return (
                <path
                    key={index}
                    d={pathD}
                    fill={segment.color}
                    className="pie-slice"
                />
            );
        });

        return slices;
    };

    if (!transactions || !categories) {
        return <div className="skeleton" style={{ height: 200 }} />;
    }

    if (chartData.length === 0) {
        return (
            <section className="expense-pie-chart card">
                <h3><PieChart size={18} /> Expense Breakdown</h3>
                <p className="empty-message">No expenses in this period.</p>
            </section>
        );
    }

    return (
        <section className="expense-pie-chart card">
            <div className="pie-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}><PieChart size={18} /> Expense Breakdown</h3>
                <div className="chart-type-toggle">
                    <button
                        className={viewMode === 'chart' ? 'active' : ''}
                        onClick={() => setViewMode('chart')}
                        title="Pie Chart"
                    >
                        <PieChart size={16} />
                    </button>
                    <button
                        className={viewMode === 'table' ? 'active' : ''}
                        onClick={() => setViewMode('table')}
                        title="Table View"
                    >
                        <Table size={16} />
                    </button>
                </div>
            </div>

            {viewMode === 'table' ? (
                <CategorySpendingTable />
            ) : (
                <>
                    <div className="pie-container">
                        <svg viewBox="0 0 100 100" className="pie-svg">
                            {generatePieSlices()}
                        </svg>
                        <div className="pie-center">
                            <span className="pie-total">{formatCurrency(total)}</span>
                            <span className="pie-label">Total</span>
                        </div>
                    </div>

                    <ul className="pie-legend">
                        {chartData.slice(0, 6).map(item => (
                            <li key={item.id} className="legend-item">
                                <span className="legend-color" style={{ backgroundColor: item.color }} />
                                <span className="legend-name">{item.name}</span>
                                <span className="legend-value">{item.percentage.toFixed(1)}%</span>
                            </li>
                        ))}
                        {chartData.length > 6 && (
                            <li className="legend-item">
                                <span className="legend-color" style={{ backgroundColor: '#6b7280' }} />
                                <span className="legend-name">+ {chartData.length - 6} more</span>
                            </li>
                        )}
                    </ul>
                </>
            )}
        </section>
    );
}
