import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import { ArrowUpDown, AlertTriangle, CheckCircle, ShieldAlert, LayoutList, Table as TableIcon } from 'lucide-react';

type SortField = 'amount' | 'name' | 'count' | 'percentage';
type SortOrder = 'asc' | 'desc';

interface Props {
    className?: string;
    showBudget?: boolean;
    compact?: boolean;
}

export default function CategorySpendingTable({ className = '', showBudget = true, compact = false }: Props) {
    const { dateRange } = useStore();
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const [sortField, setSortField] = useState<SortField>('amount');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');

    const tableData = useMemo(() => {
        if (!transactions || !categories) return [];

        // Filter expenses within active date range
        const periodExpenses = transactions.filter(
            tx => tx.type === 'expense' &&
                tx.date >= dateRange.startDate &&
                tx.date <= dateRange.endDate
        );

        const totalSpentAll = periodExpenses.reduce((sum, tx) => sum + tx.amount, 0);

        // Group by categoryId
        const map: Record<number, { amount: number; count: number }> = {};
        periodExpenses.forEach(tx => {
            if (!map[tx.categoryId]) {
                map[tx.categoryId] = { amount: 0, count: 0 };
            }
            map[tx.categoryId].amount += tx.amount;
            map[tx.categoryId].count += 1;
        });

        // Map to table rows
        const rows = Object.entries(map).map(([catIdStr, stats]) => {
            const catId = Number(catIdStr);
            const category = categories.find(c => c.id === catId);
            const percentage = totalSpentAll > 0 ? (stats.amount / totalSpentAll) * 100 : 0;
            const avgPerTx = stats.count > 0 ? stats.amount / stats.count : 0;
            const budget = category?.budgetLimit;
            const budgetPercent = budget && budget > 0 ? (stats.amount / budget) * 100 : null;

            return {
                id: catId,
                name: category?.name || 'Unknown',
                color: category?.color || '#6366f1',
                type: category?.type || 'expense',
                amount: stats.amount,
                count: stats.count,
                percentage,
                avgPerTx,
                budget,
                budgetPercent
            };
        });

        // Sort rows
        return rows.sort((a, b) => {
            let comp = 0;
            if (sortField === 'amount') comp = a.amount - b.amount;
            else if (sortField === 'name') comp = a.name.localeCompare(b.name);
            else if (sortField === 'count') comp = a.count - b.count;
            else if (sortField === 'percentage') comp = a.percentage - b.percentage;

            return sortOrder === 'desc' ? -comp : comp;
        });
    }, [transactions, categories, dateRange, sortField, sortOrder]);

    const totalExpense = useMemo(() => {
        return tableData.reduce((sum, item) => sum + item.amount, 0);
    }, [tableData]);

    const totalCount = useMemo(() => {
        return tableData.reduce((sum, item) => sum + item.count, 0);
    }, [tableData]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    if (!transactions || !categories) {
        return <div className="skeleton" style={{ height: 180, borderRadius: 12 }} />;
    }

    if (tableData.length === 0) {
        return (
            <div className={`spending-table-empty ${className}`}>
                <p className="empty-message">No expense records found in this period.</p>
            </div>
        );
    }

    return (
        <div className={`spending-breakdown-wrapper ${className}`}>
            {/* Top Toolbar */}
            <div className="spending-table-toolbar">
                <div className="spending-stats-summary">
                    <span className="summary-stat-pill">
                        Total: <strong>{formatCurrency(totalExpense)}</strong>
                    </span>
                    <span className="summary-stat-sub">
                        {tableData.length} categories • {totalCount} txs
                    </span>
                </div>

                <div className="layout-toggle-group">
                    <button
                        className={`layout-toggle-btn ${viewLayout === 'table' ? 'active' : ''}`}
                        onClick={() => setViewLayout('table')}
                        title="Grid Table Layout"
                    >
                        <TableIcon size={14} />
                    </button>
                    <button
                        className={`layout-toggle-btn ${viewLayout === 'cards' ? 'active' : ''}`}
                        onClick={() => setViewLayout('cards')}
                        title="List Card Layout"
                    >
                        <LayoutList size={14} />
                    </button>
                </div>
            </div>

            {viewLayout === 'table' ? (
                <div className="table-scroll-container">
                    <table className="modern-spending-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')} className="sortable-col col-category">
                                    <div className="th-content">
                                        <span>Category</span>
                                        <ArrowUpDown size={11} className={sortField === 'name' ? 'active-sort' : ''} />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('count')} className="sortable-col col-count text-center">
                                    <div className="th-content center">
                                        <span>Count</span>
                                        <ArrowUpDown size={11} className={sortField === 'count' ? 'active-sort' : ''} />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('amount')} className="sortable-col col-amount text-right">
                                    <div className="th-content right">
                                        <span>Total Spent</span>
                                        <ArrowUpDown size={11} className={sortField === 'amount' ? 'active-sort' : ''} />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('percentage')} className="sortable-col col-share">
                                    <div className="th-content">
                                        <span>Share</span>
                                        <ArrowUpDown size={11} className={sortField === 'percentage' ? 'active-sort' : ''} />
                                    </div>
                                </th>
                                {showBudget && !compact && (
                                    <th className="col-budget text-center">
                                        <span>Budget Status</span>
                                    </th>
                                )}
                                {!compact && (
                                    <th className="col-avg text-right">
                                        <span>Avg / Tx</span>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map(row => (
                                <tr key={row.id} className="spending-row">
                                    <td className="col-category">
                                        <div className="category-meta-inline">
                                            <span
                                                className="cat-indicator-dot"
                                                style={{ backgroundColor: row.color }}
                                            />
                                            <span className="cat-title">{row.name}</span>
                                        </div>
                                    </td>
                                    <td className="col-count text-center">
                                        <span className="tx-count-pill">{row.count}</span>
                                    </td>
                                    <td className="col-amount text-right">
                                        <span className="spend-amount-text">{formatCurrency(row.amount)}</span>
                                    </td>
                                    <td className="col-share">
                                        <div className="share-bar-cell">
                                            <div className="share-track">
                                                <div
                                                    className="share-fill"
                                                    style={{
                                                        width: `${Math.min(row.percentage, 100)}%`,
                                                        backgroundColor: row.color
                                                    }}
                                                />
                                            </div>
                                            <span className="share-percentage-val">
                                                {row.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    {showBudget && !compact && (
                                        <td className="col-budget text-center">
                                            {row.budget ? (
                                                <span className={`budget-pill ${
                                                    row.budgetPercent! >= 100 ? 'danger' :
                                                    row.budgetPercent! >= 80 ? 'warning' : 'success'
                                                }`}>
                                                    {row.budgetPercent! >= 100 ? (
                                                        <><ShieldAlert size={11} /> {row.budgetPercent!.toFixed(0)}%</>
                                                    ) : row.budgetPercent! >= 80 ? (
                                                        <><AlertTriangle size={11} /> {row.budgetPercent!.toFixed(0)}%</>
                                                    ) : (
                                                        <><CheckCircle size={11} /> {row.budgetPercent!.toFixed(0)}%</>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="budget-none">-</span>
                                            )}
                                        </td>
                                    )}
                                    {!compact && (
                                        <td className="col-avg text-right">
                                            <span className="spend-avg-text">{formatCurrency(row.avgPerTx)}</span>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="spending-footer-row">
                                <td>
                                    <strong>Total ({tableData.length})</strong>
                                </td>
                                <td className="text-center">
                                    <strong>{totalCount}</strong>
                                </td>
                                <td className="text-right">
                                    <strong className="footer-total-val">{formatCurrency(totalExpense)}</strong>
                                </td>
                                <td>
                                    <strong>100%</strong>
                                </td>
                                {showBudget && !compact && <td />}
                                {!compact && (
                                    <td className="text-right">
                                        <strong className="footer-avg-val">
                                            {totalCount > 0 ? formatCurrency(totalExpense / totalCount) : '-'}
                                        </strong>
                                    </td>
                                )}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                /* Card / List Layout for Compact & Mobile views */
                <div className="spending-cards-list">
                    {tableData.map(row => (
                        <div key={row.id} className="spending-card-item">
                            <div className="spending-card-top">
                                <div className="category-meta-inline">
                                    <span
                                        className="cat-indicator-dot"
                                        style={{ backgroundColor: row.color }}
                                    />
                                    <span className="cat-title">{row.name}</span>
                                    <span className="tx-count-pill">{row.count} tx</span>
                                </div>
                                <span className="spend-amount-text">{formatCurrency(row.amount)}</span>
                            </div>

                            <div className="spending-card-progress">
                                <div className="share-track">
                                    <div
                                        className="share-fill"
                                        style={{
                                            width: `${Math.min(row.percentage, 100)}%`,
                                            backgroundColor: row.color
                                        }}
                                    />
                                </div>
                                <span className="share-percentage-val">{row.percentage.toFixed(1)}%</span>
                            </div>

                            <div className="spending-card-bottom">
                                <span className="card-avg-label">Avg: {formatCurrency(row.avgPerTx)}/tx</span>
                                {row.budget ? (
                                    <span className={`budget-pill ${
                                        row.budgetPercent! >= 100 ? 'danger' :
                                        row.budgetPercent! >= 80 ? 'warning' : 'success'
                                    }`}>
                                        {row.budgetPercent! >= 100 ? (
                                            <><ShieldAlert size={11} /> Over Budget ({row.budgetPercent!.toFixed(0)}%)</>
                                        ) : row.budgetPercent! >= 80 ? (
                                            <><AlertTriangle size={11} /> Near Limit ({row.budgetPercent!.toFixed(0)}%)</>
                                        ) : (
                                            <><CheckCircle size={11} /> On Track ({row.budgetPercent!.toFixed(0)}%)</>
                                        )}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
