import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { formatCurrency } from '../utils/currency';
import { Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function TagComparison() {
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const [monthOffset, setMonthOffset] = useState(0);

    const { chartData, months, tagTotals } = useMemo(() => {
        if (!transactions) {
            return { chartData: null, months: [], tagTotals: [] };
        }

        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset - 1, 1);

        const formatMonth = (d: Date) => d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const currentKey = getMonthKey(currentMonth);
        const prevKey = getMonthKey(prevMonth);

        // Calculate expense totals per tag per month
        const totals: Record<string, { current: number; prev: number; count: number }> = {};

        transactions
            .filter(tx => tx.type === 'expense' && tx.tags && tx.tags.length > 0)
            .forEach(tx => {
                tx.tags!.forEach(tag => {
                    if (!totals[tag]) {
                        totals[tag] = { current: 0, prev: 0, count: 0 };
                    }
                    if (tx.date.startsWith(currentKey)) {
                        totals[tag].current += tx.amount;
                        totals[tag].count++;
                    } else if (tx.date.startsWith(prevKey)) {
                        totals[tag].prev += tx.amount;
                    }
                });
            });

        // Sort by current month spending and take top 6
        const sortedTags = Object.entries(totals)
            .filter(([_, data]) => data.current > 0 || data.prev > 0)
            .sort((a, b) => b[1].current - a[1].current)
            .slice(0, 6);

        const labels = sortedTags.map(([tag]) => `#${tag}`);
        const currentData = sortedTags.map(([_, data]) => data.current);
        const prevData = sortedTags.map(([_, data]) => data.prev);

        // Generate colors for tags (using primary color variants)
        const colors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'
        ];

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
            tagTotals: sortedTags.map(([tag, data], _i) => ({
                tag,
                current: data.current,
                prev: data.prev,
                count: data.count,
                change: data.prev > 0 ? ((data.current - data.prev) / data.prev) * 100 : 0
            }))
        };
    }, [transactions, monthOffset]);

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
        <section className="card tag-comparison">
            <div className="comparison-header">
                <h3><Tag size={16} /> Tag Comparison</h3>
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

            {tagTotals.length === 0 ? (
                <p className="empty-message">No tagged expenses in this period.</p>
            ) : (
                <>
                    <div className="chart-container" style={{ height: 200 }}>
                        <Bar data={chartData} options={options} />
                    </div>

                    <div className="comparison-details">
                        {tagTotals.map((tag, i) => (
                            <div key={i} className="comparison-row">
                                <span className="cat-name">#{tag.tag}</span>
                                <span className={`change ${tag.change > 0 ? 'up' : tag.change < 0 ? 'down' : ''}`}>
                                    {tag.change > 0 ? '↑' : tag.change < 0 ? '↓' : '→'}
                                    {Math.abs(tag.change).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
