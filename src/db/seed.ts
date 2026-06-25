import { db, type Category } from './db';

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
    { name: 'Salary', type: 'income', color: '#10B981', isDefault: true },
    { name: 'Freelance', type: 'income', color: '#34D399', isDefault: true },
    { name: 'Food', type: 'expense', color: '#F87171', isDefault: true },
    { name: 'Transport', type: 'expense', color: '#60A5FA', isDefault: true },
    { name: 'Housing', type: 'expense', color: '#A78BFA', isDefault: true },
    { name: 'Utilities', type: 'expense', color: '#FBBF24', isDefault: true },
    { name: 'Entertainment', type: 'expense', color: '#EC4899', isDefault: true },
    { name: 'Shopping', type: 'expense', color: '#F472B6', isDefault: true },
    { name: 'Health', type: 'expense', color: '#34D399', isDefault: true },
    { name: 'Education', type: 'expense', color: '#60A5FA', isDefault: true },
];

export async function seedDatabase() {
    const count = await db.categories.count();
    if (count === 0) {
        await db.categories.bulkAdd(DEFAULT_CATEGORIES as Category[]);
        console.log('Database seeded with default categories');
    }
}
