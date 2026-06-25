import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useToast } from '../store/useToast';
import { useStore } from '../store/useStore';
import { getDateRange } from '../utils/dateUtils';

/**
 * Hook that monitors category spending and shows alerts when approaching/exceeding budget limits.
 * Triggers at 80% (warning) and 100% (exceeded) of budget.
 */
export function useBudgetAlerts() {
    const { addToast } = useToast();
    const { salaryDay } = useStore();
    const categories = useLiveQuery(() => db.categories.toArray());
    const transactions = useLiveQuery(() => db.transactions.toArray());

    // Track which alerts have been shown this session (avoid spam)
    const shownAlerts = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!categories || !transactions) return;

        // Get current salary period range for filtering
        const range = getDateRange('salary', undefined, undefined, salaryDay);

        // Filter transactions within salary period
        const periodTransactions = transactions.filter(
            tx => tx.date >= range.startDate && tx.date <= range.endDate
        );

        // Check each category with a budget
        categories.forEach(cat => {
            if (!cat.budgetLimit || cat.budgetLimit <= 0) return;

            // Calculate spending for this category in current period
            const spent = periodTransactions
                .filter(tx => tx.categoryId === cat.id && tx.type === 'expense')
                .reduce((sum, tx) => sum + tx.amount, 0);

            const percentage = (spent / cat.budgetLimit) * 100;
            const alertKey80 = `${cat.id}-80`;
            const alertKey100 = `${cat.id}-100`;

            // 100% exceeded
            if (percentage >= 100 && !shownAlerts.current.has(alertKey100)) {
                shownAlerts.current.add(alertKey100);
                addToast(`🚨 Budget exceeded for ${cat.name}! (${Math.round(percentage)}%)`, 'error');
            }
            // 80% warning
            else if (percentage >= 80 && percentage < 100 && !shownAlerts.current.has(alertKey80)) {
                shownAlerts.current.add(alertKey80);
                addToast(`⚠️ ${cat.name} budget at ${Math.round(percentage)}%`, 'info');
            }
        });
    }, [categories, transactions, salaryDay, addToast]);
}
