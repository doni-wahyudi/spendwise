import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { Search, X } from 'lucide-react';

export default function SearchFilter() {
    const { searchFilter, setSearchFilter, clearSearchFilter } = useStore();
    const categories = useLiveQuery(() => db.categories.toArray());

    // Get all tags from tags table and transactions
    const allTags = useLiveQuery(async () => {
        const tagDefs = await db.tags.toArray();
        const txs = await db.transactions.toArray();
        const tagSet = new Set<string>();
        tagDefs.forEach(t => tagSet.add(t.name));
        txs.forEach(tx => tx.tags?.forEach(t => tagSet.add(t)));
        return Array.from(tagSet).sort();
    }, []);

    const hasActiveFilter = searchFilter.searchText || searchFilter.categoryId || searchFilter.type !== 'all' || searchFilter.tag;

    return (
        <div className="search-filter">
            <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search note, category, tag, amount..."
                    value={searchFilter.searchText}
                    onChange={(e) => setSearchFilter({ searchText: e.target.value })}
                    className="search-input"
                />
                {hasActiveFilter && (
                    <button onClick={clearSearchFilter} className="clear-search-btn" title="Clear filters">
                        <X size={16} />
                    </button>
                )}
            </div>

            <div className="filter-row">
                <select
                    value={searchFilter.categoryId || ''}
                    onChange={(e) => setSearchFilter({ categoryId: e.target.value ? parseInt(e.target.value) : null })}
                    className="filter-select"
                >
                    <option value="">All Categories</option>
                    {categories?.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <select
                    value={searchFilter.tag || ''}
                    onChange={(e) => setSearchFilter({ tag: e.target.value || null })}
                    className="filter-select tag-filter"
                >
                    <option value="">All Tags</option>
                    {allTags?.map(tag => (
                        <option key={tag} value={tag}>#{tag}</option>
                    ))}
                </select>
            </div>

            <div className="filter-type-buttons">
                <button
                    className={searchFilter.type === 'all' ? 'active' : ''}
                    onClick={() => setSearchFilter({ type: 'all' })}
                >
                    All
                </button>
                <button
                    className={searchFilter.type === 'income' ? 'active income' : ''}
                    onClick={() => setSearchFilter({ type: 'income' })}
                >
                    Income
                </button>
                <button
                    className={searchFilter.type === 'expense' ? 'active expense' : ''}
                    onClick={() => setSearchFilter({ type: 'expense' })}
                >
                    Expense
                </button>
            </div>
        </div>
    );
}
