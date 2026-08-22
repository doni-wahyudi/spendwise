import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import { t } from '../i18n/translations';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeatMapCalendar() {
    const { language } = useStore();
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const [monthOffset, setMonthOffset] = useState(0);

    const { calendarData, monthLabel, stats } = useMemo(() => {
        if (!transactions) {
            return { calendarData: [], monthLabel: '', stats: null };
        }

        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        // Get expenses for this month
        const monthExpenses = transactions.filter(
            tx => tx.type === 'expense' && tx.date.startsWith(monthKey)
        );

        // Calculate spending per day
        const dailyTotals: Record<number, number> = {};
        let maxSpend = 0;
        let totalSpend = 0;

        monthExpenses.forEach(tx => {
            const day = parseInt(tx.date.split('-')[2]);
            dailyTotals[day] = (dailyTotals[day] || 0) + tx.amount;
            if (dailyTotals[day] > maxSpend) maxSpend = dailyTotals[day];
            totalSpend += tx.amount;
        });

        // Build calendar grid
        const calendar: { day: number | null; amount: number; intensity: number }[] = [];

        // Add empty cells for days before first of month
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendar.push({ day: null, amount: 0, intensity: 0 });
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const amount = dailyTotals[day] || 0;
            const intensity = maxSpend > 0 ? (amount / maxSpend) : 0;
            calendar.push({ day, amount, intensity });
        }

        // Find highest spending day
        let highestDay = 0;
        let highestAmount = 0;
        Object.entries(dailyTotals).forEach(([day, amount]) => {
            if (amount > highestAmount) {
                highestDay = parseInt(day);
                highestAmount = amount;
            }
        });

        const spendingDays = Object.keys(dailyTotals).length;
        const avgDaily = spendingDays > 0 ? totalSpend / spendingDays : 0;

        return {
            calendarData: calendar,
            monthLabel: targetDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
            stats: {
                total: totalSpend,
                avgDaily,
                highestDay,
                highestAmount,
                spendingDays
            }
        };
    }, [transactions, monthOffset]);

    if (!transactions) {
        return <div className="skeleton" style={{ height: 250 }} />;
    }

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getHeatColor = (intensity: number) => {
        if (intensity === 0) return 'transparent';
        if (intensity < 0.25) return 'rgba(99, 102, 241, 0.2)';
        if (intensity < 0.5) return 'rgba(99, 102, 241, 0.4)';
        if (intensity < 0.75) return 'rgba(239, 68, 68, 0.4)';
        return 'rgba(239, 68, 68, 0.7)';
    };

    return (
        <div className="heat-map-calendar">
            <div className="heatmap-header">
                <h3><CalendarDays size={16} /> Spending Heat Map</h3>
                <div className="month-nav">
                    <button onClick={() => setMonthOffset(o => o + 1)}>
                        <ChevronLeft size={16} />
                    </button>
                    <span>{monthLabel}</span>
                    <button onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="calendar-grid">
                {weekdays.map(day => (
                    <div key={day} className="weekday-label">{day}</div>
                ))}

                {calendarData.map((cell, i) => (
                    <div
                        key={i}
                        className={`calendar-cell ${cell.day ? 'has-day' : 'empty'}`}
                        style={{ backgroundColor: cell.day ? getHeatColor(cell.intensity) : 'transparent' }}
                        title={cell.day ? `${cell.day}: ${formatCurrency(cell.amount)}` : ''}
                    >
                        {cell.day && (
                            <>
                                <span className="day-number">{cell.day}</span>
                                {cell.amount > 0 && (
                                    <span className="day-amount">{(cell.amount / 1000).toFixed(0)}K</span>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {stats && stats.total > 0 && (
                <div className="heatmap-stats">
                    <div className="stat">
                        <span className="label">{t(language, 'total')}</span>
                        <span className="value">{formatCurrency(stats.total)}</span>
                    </div>
                    <div className="stat">
                        <span className="label">{language === 'id' ? 'Rata-rata/hari' : 'Avg/day'}</span>
                        <span className="value">{formatCurrency(stats.avgDaily)}</span>
                    </div>
                    <div className="stat">
                        <span className="label">{t(language, 'peak')}</span>
                        <span className="value">Day {stats.highestDay}</span>
                    </div>
                </div>
            )}

            <div className="heatmap-legend">
                <span>{t(language, 'less')}</span>
                <div className="legend-scale">
                    <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }} />
                    <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.4)' }} />
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)' }} />
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)' }} />
                </div>
                <span>{t(language, 'more')}</span>
            </div>
        </div>
    );
}
