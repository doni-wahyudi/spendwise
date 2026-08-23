import type { LedgerItem } from '../db/db';

/**
 * Calculates total paid amount for a ledger item.
 * Supports backward compatibility with legacy isPaid items without explicit payment arrays.
 */
export function getLedgerPaidAmount(item: LedgerItem): number {
    if (item.payments && item.payments.length > 0) {
        return item.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    }
    if (item.isPaid) {
        return item.amount;
    }
    return 0;
}

/**
 * Calculates remaining unpaid amount for a ledger item.
 */
export function getLedgerRemainingAmount(item: LedgerItem): number {
    const paid = getLedgerPaidAmount(item);
    return Math.max(0, item.amount - paid);
}

/**
 * Returns progress percentage (0 - 100).
 */
export function getLedgerProgressPercent(item: LedgerItem): number {
    if (item.amount <= 0) return 100;
    const paid = getLedgerPaidAmount(item);
    return Math.min(100, Math.max(0, Math.round((paid / item.amount) * 100)));
}

/**
 * Returns ledger settlement status: 'unpaid' | 'partial' | 'paid'.
 */
export function getLedgerStatus(item: LedgerItem): 'unpaid' | 'partial' | 'paid' {
    const paid = getLedgerPaidAmount(item);
    if (paid >= item.amount || item.isPaid) {
        return 'paid';
    }
    if (paid > 0) {
        return 'partial';
    }
    return 'unpaid';
}
