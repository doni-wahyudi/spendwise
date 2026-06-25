import { db, type RecurringTransaction } from './db';

// Calculate next occurrence date based on frequency
export function getNextOccurrence(lastDate: string, frequency: RecurringTransaction['frequency']): string {
    const date = new Date(lastDate + 'T00:00:00');

    switch (frequency) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return date.toISOString().split('T')[0];
}

// Check and generate due recurring transactions
export async function processRecurringTransactions(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const activeRecurring = await db.recurringTransactions.where('isActive').equals(1).toArray();

    let generatedCount = 0;

    for (const recurring of activeRecurring) {
        // Determine the next occurrence date
        let nextDate = recurring.lastGenerated
            ? getNextOccurrence(recurring.lastGenerated, recurring.frequency)
            : recurring.startDate;

        // Generate all due transactions up to today
        while (nextDate <= today) {
            // Create the transaction
            await db.transactions.add({
                type: recurring.type,
                amount: recurring.amount,
                categoryId: recurring.categoryId,
                date: nextDate,
                note: recurring.note ? `[Auto] ${recurring.note}` : '[Auto] Recurring',
                createdAt: Date.now()
            });

            // Update lastGenerated
            await db.recurringTransactions.update(recurring.id, {
                lastGenerated: nextDate
            });

            generatedCount++;

            // Calculate next occurrence
            nextDate = getNextOccurrence(nextDate, recurring.frequency);
        }
    }

    return generatedCount;
}

// Get next occurrence preview for a recurring transaction
export function getNextOccurrencePreview(recurring: RecurringTransaction): string {
    if (!recurring.isActive) return 'Inactive';

    const nextDate = recurring.lastGenerated
        ? getNextOccurrence(recurring.lastGenerated, recurring.frequency)
        : recurring.startDate;

    const today = new Date().toISOString().split('T')[0];

    if (nextDate <= today) {
        return 'Due now';
    }

    return nextDate;
}
