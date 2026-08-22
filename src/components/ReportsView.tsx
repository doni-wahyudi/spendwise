import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction } from '../db/db';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import { formatLocalDate, getSalaryPeriodRange } from '../utils/dateUtils';
import { t } from '../i18n/translations';
import { useToast } from '../store/useToast';
import {
    FileText,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Download,
    Copy,
    Printer,
    Search,
    TrendingUp,
    TrendingDown,
    Calendar,
    Wallet,
    Percent,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Pencil,
    Sparkles,
    Tag,
    ListFilter
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type ReportPeriodType = 'monthly' | 'salary' | 'custom' | 'yearly';
type BreakdownType = 'expense' | 'income';
type SortField = 'amount' | 'name' | 'count';

export default function ReportsView() {
    const { language, salaryDay, setEditingTransaction } = useStore();
    const { addToast } = useToast();

    // Period selector state
    const [periodType, setPeriodType] = useState<ReportPeriodType>('monthly');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [salaryCycleOffset, setSalaryCycleOffset] = useState<number>(0);
    const [customStart, setCustomStart] = useState<string>(() => {
        const d = new Date();
        return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), 1));
    });
    const [customEnd, setCustomEnd] = useState<string>(() => formatLocalDate(new Date()));

    // View & Filter states
    const [breakdownType, setBreakdownType] = useState<BreakdownType>('expense');
    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortField>('amount');
    const [activeDrillTab, setActiveDrillTab] = useState<Record<number, 'items' | 'txs'>>({});

    // Live queries
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());
    const accounts = useLiveQuery(() => db.accounts.toArray());

    // Helper functions for names/colors
    const getCategory = (id: number) => categories?.find(c => c.id === id);
    const getAccount = (id?: number) => (id ? accounts?.find(a => a.id === id) : undefined);

    // Calculate active date range based on periodType
    const { startDate, endDate, periodLabel, prevStartDate, prevEndDate } = useMemo(() => {
        const d = new Date(currentDate);

        if (periodType === 'monthly') {
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

            // Previous month for comparison
            const prevStart = new Date(d.getFullYear(), d.getMonth() - 1, 1);
            const prevEnd = new Date(d.getFullYear(), d.getMonth(), 0);

            const lbl = d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                month: 'long',
                year: 'numeric'
            });

            return {
                startDate: formatLocalDate(start),
                endDate: formatLocalDate(end),
                periodLabel: lbl,
                prevStartDate: formatLocalDate(prevStart),
                prevEndDate: formatLocalDate(prevEnd)
            };
        }

        if (periodType === 'salary') {
            // Calculate base salary cycle
            const baseSalaryRange = getSalaryPeriodRange(salaryDay);
            // Apply salaryCycleOffset months
            const [baseYear, baseMonth, baseDay] = baseSalaryRange.startDate.split('-').map(Number);
            const startMonthDate = new Date(baseYear, baseMonth - 1 + salaryCycleOffset, baseDay);
            const cycleStartYear = startMonthDate.getFullYear();
            const cycleStartMonth = startMonthDate.getMonth();

            const daysInMonth = new Date(cycleStartYear, cycleStartMonth + 1, 0).getDate();
            const actualStartDay = Math.min(salaryDay, daysInMonth);
            const start = new Date(cycleStartYear, cycleStartMonth, actualStartDay);

            let end: Date;
            if (salaryDay === 1) {
                end = new Date(cycleStartYear, cycleStartMonth + 1, 0);
            } else {
                const nextMonth = cycleStartMonth + 1;
                const nextMonthYear = nextMonth > 11 ? cycleStartYear + 1 : cycleStartYear;
                const adjustedNextMonth = nextMonth > 11 ? 0 : nextMonth;
                const daysInNextMonth = new Date(nextMonthYear, adjustedNextMonth + 1, 0).getDate();
                const actualEndDay = Math.min(salaryDay - 1, daysInNextMonth);
                end = new Date(nextMonthYear, adjustedNextMonth, actualEndDay);
            }

            // Previous cycle
            const prevStart = new Date(start);
            prevStart.setMonth(prevStart.getMonth() - 1);
            const prevEnd = new Date(end);
            prevEnd.setMonth(prevEnd.getMonth() - 1);

            const formatOpt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
            const lbl = `${start.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', formatOpt)} - ${end.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { ...formatOpt, year: 'numeric' })}`;

            return {
                startDate: formatLocalDate(start),
                endDate: formatLocalDate(end),
                periodLabel: `${t(language, 'salaryCycle')} (${lbl})`,
                prevStartDate: formatLocalDate(prevStart),
                prevEndDate: formatLocalDate(prevEnd)
            };
        }

        if (periodType === 'yearly') {
            const start = new Date(d.getFullYear(), 0, 1);
            const end = new Date(d.getFullYear(), 11, 31);

            const prevStart = new Date(d.getFullYear() - 1, 0, 1);
            const prevEnd = new Date(d.getFullYear() - 1, 11, 31);

            return {
                startDate: formatLocalDate(start),
                endDate: formatLocalDate(end),
                periodLabel: `${d.getFullYear()}`,
                prevStartDate: formatLocalDate(prevStart),
                prevEndDate: formatLocalDate(prevEnd)
            };
        }

        // Custom range
        const s = customStart || formatLocalDate(new Date());
        const e = customEnd || formatLocalDate(new Date());

        // Previous duration of same length for comparison
        const diffMs = Math.abs(new Date(e).getTime() - new Date(s).getTime());
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
        const prevEndCustom = new Date(new Date(s).getTime() - 24 * 60 * 60 * 1000);
        const prevStartCustom = new Date(prevEndCustom.getTime() - (diffDays - 1) * 24 * 60 * 60 * 1000);

        return {
            startDate: s,
            endDate: e,
            periodLabel: `${s} - ${e}`,
            prevStartDate: formatLocalDate(prevStartCustom),
            prevEndDate: formatLocalDate(prevEndCustom)
        };
    }, [periodType, currentDate, salaryCycleOffset, salaryDay, customStart, customEnd, language]);

    // Period Navigation Steppers
    const handlePrevPeriod = () => {
        if (periodType === 'monthly') {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        } else if (periodType === 'salary') {
            setSalaryCycleOffset(prev => prev - 1);
        } else if (periodType === 'yearly') {
            setCurrentDate(prev => new Date(prev.getFullYear() - 1, 0, 1));
        }
    };

    const handleNextPeriod = () => {
        if (periodType === 'monthly') {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        } else if (periodType === 'salary') {
            setSalaryCycleOffset(prev => prev + 1);
        } else if (periodType === 'yearly') {
            setCurrentDate(prev => new Date(prev.getFullYear() + 1, 0, 1));
        }
    };

    const handleCurrentPeriod = () => {
        setCurrentDate(new Date());
        setSalaryCycleOffset(0);
    };

    // Filter transactions in active period
    const activeTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx => tx.date >= startDate && tx.date <= endDate);
    }, [transactions, startDate, endDate]);

    // Filter transactions in previous period for comparative metrics
    const prevPeriodTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx => tx.date >= prevStartDate && tx.date <= prevEndDate);
    }, [transactions, prevStartDate, prevEndDate]);

    // Executive Summary Metrics
    const metrics = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        let incomeCount = 0;
        let expenseCount = 0;

        // Daily expense map for sparkline & peak day
        const dailyExpenses: Record<string, number> = {};

        activeTransactions.forEach(tx => {
            if (tx.type === 'income') {
                totalIncome += tx.amount;
                incomeCount++;
            } else {
                totalExpense += tx.amount;
                expenseCount++;
                dailyExpenses[tx.date] = (dailyExpenses[tx.date] || 0) + tx.amount;
            }
        });

        const netBalance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

        // Calculate days in period
        const startD = new Date(startDate);
        const endD = new Date(endDate);
        const daysCount = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const dailyAverage = totalExpense / daysCount;

        // Peak Spending Day
        let peakDay = '';
        let peakAmount = 0;
        Object.entries(dailyExpenses).forEach(([date, amt]) => {
            if (amt > peakAmount) {
                peakAmount = amt;
                peakDay = date;
            }
        });

        // Previous Period comparison
        let prevIncome = 0;
        let prevExpense = 0;
        prevPeriodTransactions.forEach(tx => {
            if (tx.type === 'income') prevIncome += tx.amount;
            else prevExpense += tx.amount;
        });

        const expenseDeltaPercent = prevExpense > 0
            ? ((totalExpense - prevExpense) / prevExpense) * 100
            : null;
        const incomeDeltaPercent = prevIncome > 0
            ? ((totalIncome - prevIncome) / prevIncome) * 100
            : null;

        return {
            totalIncome,
            totalExpense,
            netBalance,
            savingsRate,
            dailyAverage,
            daysCount,
            peakDay,
            peakAmount,
            incomeCount,
            expenseCount,
            dailyExpenses,
            expenseDeltaPercent,
            incomeDeltaPercent
        };
    }, [activeTransactions, prevPeriodTransactions, startDate, endDate]);

    // Hierarchical Category Breakdown Data
    const categoryBreakdownData = useMemo(() => {
        if (!activeTransactions || !categories) return [];

        const targetType = breakdownType; // 'expense' or 'income'
        const relevantTxs = activeTransactions.filter(tx => tx.type === targetType);
        const totalTargetAmount = targetType === 'expense' ? metrics.totalExpense : metrics.totalIncome;

        // Group by categoryId
        const catMap: Record<number, {
            categoryId: number;
            totalAmount: number;
            txCount: number;
            transactions: Transaction[];
            itemGroups: Record<string, { note: string; count: number; totalAmount: number; txs: Transaction[] }>;
            tagCounts: Record<string, number>;
        }> = {};

        relevantTxs.forEach(tx => {
            if (!catMap[tx.categoryId]) {
                catMap[tx.categoryId] = {
                    categoryId: tx.categoryId,
                    totalAmount: 0,
                    txCount: 0,
                    transactions: [],
                    itemGroups: {},
                    tagCounts: {}
                };
            }

            const item = catMap[tx.categoryId];
            item.totalAmount += tx.amount;
            item.txCount += 1;
            item.transactions.push(tx);

            // Group by item note / description
            const noteKey = (tx.note?.trim()) || 'Uncategorized Item / No Note';
            if (!item.itemGroups[noteKey]) {
                item.itemGroups[noteKey] = {
                    note: noteKey,
                    count: 0,
                    totalAmount: 0,
                    txs: []
                };
            }
            item.itemGroups[noteKey].count += 1;
            item.itemGroups[noteKey].totalAmount += tx.amount;
            item.itemGroups[noteKey].txs.push(tx);

            // Count tags
            if (tx.tags && tx.tags.length > 0) {
                tx.tags.forEach(tag => {
                    item.tagCounts[tag] = (item.tagCounts[tag] || 0) + 1;
                });
            }
        });

        // Convert to array
        let list = Object.values(catMap).map(data => {
            const cat = categories.find(c => c.id === data.categoryId);
            const percentage = totalTargetAmount > 0 ? (data.totalAmount / totalTargetAmount) * 100 : 0;
            const avgPerTx = data.txCount > 0 ? data.totalAmount / data.txCount : 0;
            const budget = cat?.budgetLimit;
            const budgetPercent = budget && budget > 0 ? (data.totalAmount / budget) * 100 : null;

            // Sort item groups by amount descending
            const sortedItems = Object.values(data.itemGroups).sort((a, b) => b.totalAmount - a.totalAmount);
            // Sort transactions by date descending
            const sortedTxs = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));

            return {
                ...data,
                name: cat?.name || 'Unknown Category',
                color: cat?.color || '#6366f1',
                type: cat?.type || targetType,
                percentage,
                avgPerTx,
                budget,
                budgetPercent,
                items: sortedItems,
                transactions: sortedTxs
            };
        });

        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(cat => {
                const nameMatch = cat.name.toLowerCase().includes(query);
                const itemMatch = cat.items.some(it => it.note.toLowerCase().includes(query));
                const tagMatch = Object.keys(cat.tagCounts).some(tg => tg.toLowerCase().includes(query));
                return nameMatch || itemMatch || tagMatch;
            });
        }

        // Sort Categories
        return list.sort((a, b) => {
            if (sortBy === 'amount') return b.totalAmount - a.totalAmount;
            if (sortBy === 'count') return b.txCount - a.txCount;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });
    }, [activeTransactions, categories, breakdownType, metrics.totalExpense, metrics.totalIncome, searchQuery, sortBy]);

    // Daily Spending Chart Data
    const dailyChartData = useMemo(() => {
        if (!startDate || !endDate) return null;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.min(Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1, 31);

        const labels: string[] = [];
        const values: number[] = [];

        for (let i = 0; i < daysDiff; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const dateStr = formatLocalDate(d);
            labels.push(d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' }));
            values.push(metrics.dailyExpenses[dateStr] || 0);
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Daily Outflow',
                    data: values,
                    backgroundColor: 'rgba(239, 68, 68, 0.65)',
                    hoverBackgroundColor: '#ef4444',
                    borderRadius: 4,
                }
            ]
        };
    }, [startDate, endDate, metrics.dailyExpenses, language]);

    // Accordion Toggle
    const toggleCategoryExpand = (id: number) => {
        setExpandedCategories(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const expandAllCategories = () => {
        const all: Record<number, boolean> = {};
        categoryBreakdownData.forEach(c => {
            all[c.categoryId] = true;
        });
        setExpandedCategories(all);
    };

    const collapseAllCategories = () => {
        setExpandedCategories({});
    };

    // Export to CSV
    const handleExportCSV = () => {
        if (activeTransactions.length === 0) {
            addToast('No transaction data to export.', 'info');
            return;
        }

        const headers = ['Type', 'Category', 'Date', 'Amount', 'Source Account', 'Note / Item', 'Tags'];
        const rows = activeTransactions.map(tx => {
            const cat = getCategory(tx.categoryId)?.name || 'Unknown';
            const acc = getAccount(tx.accountId)?.name || 'Default';
            const tags = (tx.tags || []).join('; ');
            return [
                tx.type,
                `"${cat}"`,
                tx.date,
                tx.amount,
                `"${acc}"`,
                `"${(tx.note || '').replace(/"/g, '""')}"`,
                `"${tags}"`
            ];
        });

        // Summary row
        const summaryRows = [
            ['# SpendWise Financial Report', periodLabel],
            ['# Total Income', metrics.totalIncome],
            ['# Total Expense', metrics.totalExpense],
            ['# Net Balance', metrics.netBalance],
            ['# Savings Rate', `${metrics.savingsRate.toFixed(1)}%`],
            ['---', '---', '---', '---', '---', '---', '---'],
            headers
        ];

        const csvContent = 'data:text/csv;charset=utf-8,' +
            [...summaryRows.map(r => r.join(',')), ...rows.map(r => r.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `SpendWise_Report_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addToast(t(language, 'exportSuccess'), 'success');
    };

    // Copy Summary Text to Clipboard
    const handleCopySummary = () => {
        const title = `📊 *SpendWise Financial Report (${periodLabel})*`;
        const summary = [
            `💰 *${t(language, 'totalInflow')}*: +${formatCurrency(metrics.totalIncome)}`,
            `💸 *${t(language, 'totalOutflow')}*: -${formatCurrency(metrics.totalExpense)}`,
            `📈 *${t(language, 'netSavings')}*: ${metrics.netBalance >= 0 ? '+' : ''}${formatCurrency(metrics.netBalance)}`,
            `🎯 *${t(language, 'savingsRate')}*: ${metrics.savingsRate.toFixed(1)}%`,
            `📅 *${t(language, 'dailyAverage')}*: ${formatCurrency(metrics.dailyAverage)}/day`,
            ...(metrics.peakAmount > 0 ? [`🔥 *${t(language, 'peakSpendingDay')}*: ${metrics.peakDay} (${formatCurrency(metrics.peakAmount)})`] : []),
            '',
            `📁 *Top Expense Categories:*`,
            ...categoryBreakdownData.slice(0, 6).map((c, i) =>
                `${i + 1}. *${c.name}*: ${formatCurrency(c.totalAmount)} (${c.percentage.toFixed(1)}%) - ${c.txCount} items`
            )
        ].join('\n');

        const fullText = `${title}\n\n${summary}\n\n_Generated by SpendWise_`;
        navigator.clipboard.writeText(fullText).then(() => {
            addToast(t(language, 'copiedToClipboard'), 'success');
        });
    };

    // Print Report
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="reports-view-container">
            {/* Header Toolbar */}
            <div className="reports-view-header">
                <div className="reports-title-area">
                    <h2>
                        <FileText size={22} className="title-icon" />
                        {t(language, 'financialReport')}
                    </h2>
                    <span className="reports-subtitle">
                        {periodLabel}
                    </span>
                </div>

                <div className="reports-actions-group">
                    <button onClick={handleCopySummary} className="report-action-btn" title={t(language, 'copySummary')}>
                        <Copy size={16} />
                        <span className="btn-label">{t(language, 'copySummary')}</span>
                    </button>
                    <button onClick={handleExportCSV} className="report-action-btn" title={t(language, 'exportReport')}>
                        <Download size={16} />
                        <span className="btn-label">CSV</span>
                    </button>
                    <button onClick={handlePrint} className="report-action-btn print-only-hide" title={t(language, 'printReport')}>
                        <Printer size={16} />
                    </button>
                </div>
            </div>

            {/* Period Type Switcher & Stepper */}
            <div className="report-period-card">
                <div className="period-type-pills">
                    <button
                        className={`period-pill ${periodType === 'monthly' ? 'active' : ''}`}
                        onClick={() => setPeriodType('monthly')}
                    >
                        {t(language, 'monthlyReport')}
                    </button>
                    <button
                        className={`period-pill ${periodType === 'salary' ? 'active' : ''}`}
                        onClick={() => setPeriodType('salary')}
                    >
                        {t(language, 'salaryCycle')} ({salaryDay})
                    </button>
                    <button
                        className={`period-pill ${periodType === 'custom' ? 'active' : ''}`}
                        onClick={() => setPeriodType('custom')}
                    >
                        {t(language, 'customRange')}
                    </button>
                    <button
                        className={`period-pill ${periodType === 'yearly' ? 'active' : ''}`}
                        onClick={() => setPeriodType('yearly')}
                    >
                        Yearly
                    </button>
                </div>

                {/* Period Navigator */}
                {periodType !== 'custom' ? (
                    <div className="period-stepper-bar">
                        <button onClick={handlePrevPeriod} className="stepper-btn" title="Previous">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="stepper-current-label">
                            <strong>{periodLabel}</strong>
                            <button onClick={handleCurrentPeriod} className="today-badge-btn">
                                Current
                            </button>
                        </div>
                        <button onClick={handleNextPeriod} className="stepper-btn" title="Next">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="custom-range-selector">
                        <div className="date-input-group">
                            <label>From:</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                            />
                        </div>
                        <div className="date-input-group">
                            <label>To:</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                            />
                        </div>
                        <div className="custom-presets-chips">
                            <button
                                onClick={() => {
                                    const d = new Date();
                                    setCustomStart(formatLocalDate(new Date(d.getFullYear(), d.getMonth(), 1)));
                                    setCustomEnd(formatLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)));
                                }}
                            >
                                This Month
                            </button>
                            <button
                                onClick={() => {
                                    const d = new Date();
                                    setCustomStart(formatLocalDate(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
                                    setCustomEnd(formatLocalDate(new Date(d.getFullYear(), d.getMonth(), 0)));
                                }}
                            >
                                Last Month
                            </button>
                            <button
                                onClick={() => {
                                    const d = new Date();
                                    setCustomStart(formatLocalDate(new Date(d.getTime() - 30 * 24 * 60 * 60 * 1000)));
                                    setCustomEnd(formatLocalDate(d));
                                }}
                            >
                                Last 30 Days
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Executive Summary Hero Cards */}
            <div className="executive-summary-grid">
                <div className="exec-card income-card">
                    <div className="exec-card-header">
                        <span className="card-title">{t(language, 'totalInflow')}</span>
                        <div className="icon-wrapper green"><TrendingUp size={16} /></div>
                    </div>
                    <div className="exec-amount green">+{formatCurrency(metrics.totalIncome)}</div>
                    <div className="exec-footer">
                        <span>{metrics.incomeCount} transactions</span>
                        {metrics.incomeDeltaPercent !== null && (
                            <span className={`delta-tag ${metrics.incomeDeltaPercent >= 0 ? 'good' : 'neutral'}`}>
                                {metrics.incomeDeltaPercent >= 0 ? '+' : ''}{metrics.incomeDeltaPercent.toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="exec-card expense-card">
                    <div className="exec-card-header">
                        <span className="card-title">{t(language, 'totalOutflow')}</span>
                        <div className="icon-wrapper red"><TrendingDown size={16} /></div>
                    </div>
                    <div className="exec-amount red">-{formatCurrency(metrics.totalExpense)}</div>
                    <div className="exec-footer">
                        <span>{metrics.expenseCount} items</span>
                        {metrics.expenseDeltaPercent !== null && (
                            <span className={`delta-tag ${metrics.expenseDeltaPercent <= 0 ? 'good' : 'warn'}`}>
                                {metrics.expenseDeltaPercent >= 0 ? '+' : ''}{metrics.expenseDeltaPercent.toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="exec-card balance-card">
                    <div className="exec-card-header">
                        <span className="card-title">{t(language, 'netSavings')}</span>
                        <div className="icon-wrapper blue"><Wallet size={16} /></div>
                    </div>
                    <div className={`exec-amount ${metrics.netBalance >= 0 ? 'green' : 'red'}`}>
                        {metrics.netBalance >= 0 ? '+' : ''}{formatCurrency(metrics.netBalance)}
                    </div>
                    <div className="exec-footer">
                        <span className="savings-badge">
                            <Percent size={12} /> {t(language, 'savingsRate')}: {metrics.savingsRate.toFixed(1)}%
                        </span>
                    </div>
                </div>

                <div className="exec-card stats-card">
                    <div className="exec-card-header">
                        <span className="card-title">{t(language, 'dailyAverage')}</span>
                        <div className="icon-wrapper purple"><Calendar size={16} /></div>
                    </div>
                    <div className="exec-amount purple">{formatCurrency(metrics.dailyAverage)}</div>
                    <div className="exec-footer">
                        {metrics.peakAmount > 0 ? (
                            <span className="peak-info" title={`Peak on ${metrics.peakDay}`}>
                                Peak: {formatCurrency(metrics.peakAmount)} ({metrics.peakDay.slice(5)})
                            </span>
                        ) : (
                            <span>{metrics.daysCount} active days</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Cashflow Ratio Visual Bar */}
            {metrics.totalIncome > 0 && (
                <div className="cashflow-ratio-card">
                    <div className="ratio-header">
                        <span>Cash Flow Allocation</span>
                        <span>
                            Spent: <strong>{((metrics.totalExpense / metrics.totalIncome) * 100).toFixed(1)}%</strong> • Saved: <strong>{metrics.savingsRate.toFixed(1)}%</strong>
                        </span>
                    </div>
                    <div className="ratio-progress-bar">
                        <div
                            className="ratio-spent"
                            style={{ width: `${Math.min(100, (metrics.totalExpense / metrics.totalIncome) * 100)}%` }}
                        />
                        <div
                            className="ratio-saved"
                            style={{ width: `${Math.max(0, metrics.savingsRate)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Daily Spending Trend Chart */}
            {dailyChartData && metrics.totalExpense > 0 && (
                <div className="report-chart-section">
                    <div className="section-title-row">
                        <h3><Sparkles size={16} /> Daily Outflow Distribution</h3>
                        <span className="chart-total-tag">{formatCurrency(metrics.totalExpense)} total</span>
                    </div>
                    <div className="daily-chart-container" style={{ height: 160 }}>
                        <Bar
                            data={dailyChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: (ctx) => `Spent: ${formatCurrency(ctx.parsed.y ?? 0)}`
                                        }
                                    }
                                },
                                scales: {
                                    x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { size: 10 } } },
                                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa', font: { size: 10 } } }
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Category Breakdown & Item Drilldown Section */}
            <div className="category-breakdown-section">
                <div className="breakdown-header-controls">
                    <div className="breakdown-type-toggle">
                        <button
                            className={`type-btn ${breakdownType === 'expense' ? 'active expense' : ''}`}
                            onClick={() => setBreakdownType('expense')}
                        >
                            <TrendingDown size={15} />
                            {t(language, 'expenseBreakdown')} ({metrics.expenseCount})
                        </button>
                        <button
                            className={`type-btn ${breakdownType === 'income' ? 'active income' : ''}`}
                            onClick={() => setBreakdownType('income')}
                        >
                            <TrendingUp size={15} />
                            {t(language, 'incomeBreakdown')} ({metrics.incomeCount})
                        </button>
                    </div>

                    <div className="breakdown-tools">
                        {/* Search in Report */}
                        <div className="report-search-box">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Filter category or item..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Expand/Collapse All */}
                        <div className="accordion-bulk-btns">
                            <button onClick={expandAllCategories} className="bulk-btn" title="Expand All">
                                Expand All
                            </button>
                            <button onClick={collapseAllCategories} className="bulk-btn" title="Collapse All">
                                Collapse All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sort Bar */}
                <div className="breakdown-sort-bar">
                    <span className="sort-label"><ListFilter size={13} /> Sort by:</span>
                    <button
                        className={`sort-pill ${sortBy === 'amount' ? 'active' : ''}`}
                        onClick={() => setSortBy('amount')}
                    >
                        Highest Spend
                    </button>
                    <button
                        className={`sort-pill ${sortBy === 'count' ? 'active' : ''}`}
                        onClick={() => setSortBy('count')}
                    >
                        Item Count
                    </button>
                    <button
                        className={`sort-pill ${sortBy === 'name' ? 'active' : ''}`}
                        onClick={() => setSortBy('name')}
                    >
                        Name
                    </button>
                </div>

                {/* Categories Accordion List */}
                {categoryBreakdownData.length === 0 ? (
                    <div className="report-empty-box">
                        <p>{t(language, 'noDataInPeriod')}</p>
                    </div>
                ) : (
                    <div className="category-accordion-list">
                        {categoryBreakdownData.map(category => {
                            const isExpanded = !!expandedCategories[category.categoryId];
                            const currentDrillTab = activeDrillTab[category.categoryId] || 'items';

                            return (
                                <div key={category.categoryId} className={`category-report-card ${isExpanded ? 'expanded' : ''}`}>
                                    {/* Category Main Header (Clickable) */}
                                    <div
                                        className="category-card-header"
                                        onClick={() => toggleCategoryExpand(category.categoryId)}
                                    >
                                        <div className="cat-title-group">
                                            <span
                                                className="cat-color-dot"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <div className="cat-text-info">
                                                <h4>{category.name}</h4>
                                                <span className="cat-meta-sub">
                                                    {category.txCount} {category.txCount === 1 ? 'transaction' : 'transactions'} • {category.items.length} unique items
                                                </span>
                                            </div>
                                        </div>

                                        <div className="cat-amount-group">
                                            <div className="cat-amount-main">
                                                <span className="amount-val">{formatCurrency(category.totalAmount)}</span>
                                                <span className="share-tag">{category.percentage.toFixed(1)}%</span>
                                            </div>
                                            <button className="expand-indicator-btn" aria-label="Toggle details">
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Share and Budget Bar */}
                                    <div className="cat-progress-track">
                                        <div
                                            className="cat-progress-fill"
                                            style={{
                                                width: `${Math.min(category.percentage, 100)}%`,
                                                backgroundColor: category.color
                                            }}
                                        />
                                    </div>

                                    {/* Category Budget Status */}
                                    {category.budget && category.budget > 0 && (
                                        <div className="cat-budget-inline-status">
                                            <span className="budget-text">
                                                Budget: {formatCurrency(category.totalAmount)} / {formatCurrency(category.budget)} ({category.budgetPercent?.toFixed(0)}%)
                                            </span>
                                            {category.budgetPercent! >= 100 ? (
                                                <span className="budget-alert-pill danger"><ShieldAlert size={12} /> Over Limit</span>
                                            ) : category.budgetPercent! >= 80 ? (
                                                <span className="budget-alert-pill warning"><AlertTriangle size={12} /> 80%+ Used</span>
                                            ) : (
                                                <span className="budget-alert-pill success"><CheckCircle2 size={12} /> Within Budget</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Expanded Itemized Drilldown */}
                                    {isExpanded && (
                                        <div className="category-drilldown-panel">
                                            {/* Drilldown Subtabs */}
                                            <div className="drilldown-subtabs">
                                                <button
                                                    className={`drill-subtab ${currentDrillTab === 'items' ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDrillTab(prev => ({ ...prev, [category.categoryId]: 'items' }));
                                                    }}
                                                >
                                                    <Sparkles size={13} />
                                                    {t(language, 'topItems')} ({category.items.length})
                                                </button>
                                                <button
                                                    className={`drill-subtab ${currentDrillTab === 'txs' ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDrillTab(prev => ({ ...prev, [category.categoryId]: 'txs' }));
                                                    }}
                                                >
                                                    <Calendar size={13} />
                                                    {t(language, 'allTransactions')} ({category.transactions.length})
                                                </button>
                                            </div>

                                            {/* Drilldown Tab 1: Aggregated Items by Note / Description */}
                                            {currentDrillTab === 'items' && (
                                                <div className="itemized-groups-list">
                                                    {category.items.map((itemGroup, idx) => {
                                                        const itemShare = category.totalAmount > 0
                                                            ? (itemGroup.totalAmount / category.totalAmount) * 100
                                                            : 0;

                                                        return (
                                                            <div key={idx} className="item-group-row">
                                                                <div className="item-group-info">
                                                                    <span className="item-note-title">{itemGroup.note}</span>
                                                                    <div className="item-tags-sub">
                                                                        <span className="item-frequency-pill">
                                                                            {itemGroup.count}× purchase{itemGroup.count > 1 ? 's' : ''}
                                                                        </span>
                                                                        <span className="item-avg-pill">
                                                                            avg {formatCurrency(itemGroup.totalAmount / itemGroup.count)}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="item-group-amount">
                                                                    <span className="item-sum-text">
                                                                        {formatCurrency(itemGroup.totalAmount)}
                                                                    </span>
                                                                    <span className="item-share-text">
                                                                        {itemShare.toFixed(1)}% of {category.name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Drilldown Tab 2: Chronological Individual Transactions */}
                                            {currentDrillTab === 'txs' && (
                                                <div className="category-tx-ledger">
                                                    {category.transactions.map(tx => {
                                                        const acc = getAccount(tx.accountId);

                                                        return (
                                                            <div key={tx.id} className="category-tx-item">
                                                                <div className="tx-left">
                                                                    <span className="tx-date-badge">{tx.date}</span>
                                                                    <div className="tx-details">
                                                                        <span className="tx-desc">{tx.note || 'No note'}</span>
                                                                        <div className="tx-meta-chips">
                                                                            {acc && (
                                                                                <span
                                                                                    className="tx-account-chip"
                                                                                    style={{ borderColor: acc.color, color: acc.color }}
                                                                                >
                                                                                    {acc.name}
                                                                                </span>
                                                                            )}
                                                                            {tx.tags?.map(tag => (
                                                                                <span key={tag} className="tx-tag-chip">
                                                                                    #{tag}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="tx-right">
                                                                    <span className="tx-amount-value">
                                                                        {formatCurrency(tx.amount)}
                                                                    </span>
                                                                    <button
                                                                        className="tx-edit-btn"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingTransaction(tx);
                                                                        }}
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil size={13} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Tag Breakdown within Category */}
                                            {Object.keys(category.tagCounts).length > 0 && (
                                                <div className="category-tag-summary-bar">
                                                    <span className="tag-summary-title"><Tag size={12} /> Tags:</span>
                                                    {Object.entries(category.tagCounts).map(([tagName, count]) => (
                                                        <span key={tagName} className="tag-summary-chip">
                                                            #{tagName} ({count})
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
