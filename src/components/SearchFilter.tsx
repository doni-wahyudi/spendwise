import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { Search, X } from 'lucide-react';
import { t } from '../i18n/translations';

export default function SearchFilter() {
    const { searchFilter, setSearchFilter, clearSearchFilter, language } = useStore();
    const categories = useLiveQuery(() => db.categories.toArray());

    const allTags = useLiveQuery(async () => {
        const tagDefs = await db.tags.toArray();
        const txs = await db.transactions.toArray();
        const tagSet = new Set<string>();
        tagDefs.forEach(tg => tagSet.add(tg.name));
        txs.forEach(tx => tx.tags?.forEach(tg => tagSet.add(tg)));
        return Array.from(tagSet).sort();
    }, []);

    const hasActiveFilter = searchFilter.searchText || searchFilter.categoryId || searchFilter.type !== 'all' || searchFilter.tag;

    return (
        <div className="search-filter">
            <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder={t(language, 'searchPlaceholder')}
                    value={searchFilter.searchText}
                    onChange={(e) => setSearchFilter({ searchText: e.target.value })}
                    className="search-input"
                />
                {hasActiveFilter && (
                    <button onClick={clearSearchFilter} className="clear-search-btn" title={t(language, 'clearFilters')}>
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
                    <option value="">{t(language, 'allCategories')}</option>
                    {categories?.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <select
                    value={searchFilter.tag || ''}
                    onChange={(e) => setSearchFilter({ tag: e.target.value || null })}
                    className="filter-select tag-filter"
                >
                    <option value="">{t(language, 'allTags')}</option>
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
                    {t(language, 'allTypes')}
                </button>
                <button
                    className={searchFilter.type === 'income' ? 'active income' : ''}
                    onClick={() => setSearchFilter({ type: 'income' })}
                >
                    {t(language, 'income')}
                </button>
                <button
                    className={searchFilter.type === 'expense' ? 'active expense' : ''}
                    onClick={() => setSearchFilter({ type: 'expense' })}
                >
                    {t(language, 'expense')}
                </button>
            </div>
        </div>
    );
}
