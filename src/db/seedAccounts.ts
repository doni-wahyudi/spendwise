import { db } from './db';

const defaultAccounts = [
    { name: 'Cash', type: 'cash' as const, color: '#10b981', isDefault: true },
    { name: 'Bank', type: 'bank' as const, color: '#6366f1', isDefault: false },
    { name: 'E-Wallet', type: 'ewallet' as const, color: '#f59e0b', isDefault: false },
];

export async function seedAccounts() {
    const count = await db.accounts.count();
    if (count === 0) {
        await db.accounts.bulkAdd(defaultAccounts);
    }
}
