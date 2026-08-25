import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Category } from '../db/db';
import { useStore } from '../store/useStore';
import { useToast } from '../store/useToast';
import { Download, Plus, Trash2, Pencil, X, Calendar, AlertTriangle, Palette, Database, Sparkles, FolderOpen, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/currency';
import { formatLocalDate } from '../utils/dateUtils';
import RecurringManager from './RecurringManager';
import ThemeToggle from './ThemeToggle';
import DataImport from './DataImport';
import Reports from './Reports';
import LanguageToggle from './LanguageToggle';
import SavingsGoals from './SavingsGoals';
import BillReminders from './BillReminders';
import QuickTemplates from './QuickTemplates';
import SplitTransaction from './SplitTransaction';
import CurrencyConverter from './CurrencyConverter';
import HapticToggle from './HapticToggle';
import CloudBackup from './CloudBackup';
import TagManager from './TagManager';
import { seedDatabase } from '../db/seed';
import { seedAccounts } from '../db/seedAccounts';
import { t } from '../i18n/translations';

type SettingsTab = 'appearance' | 'features' | 'data' | 'categories';

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f59e0b', '#10b981', '#14b8a6', '#3b82f6', '#64748b'
];

export default function SettingsView() {
    const { addCategory, language } = useStore();
    const { addToast } = useToast();
    const categories = useLiveQuery(() => db.categories.toArray());
    const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

    // New category form state
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'income' | 'expense'>('expense');
    const [newColor, setNewColor] = useState('#6366f1');

    const [showHiddenCategories, setShowHiddenCategories] = useState(false);

    // Edit category state
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState<'income' | 'expense' | 'both'>('expense');
    const [editColor, setEditColor] = useState('#6366f1');
    const [editBudget, setEditBudget] = useState('');
    const [editHidden, setEditHidden] = useState(false);

    // Budget inline editing state
    const [editingBudget, setEditingBudget] = useState<number | null>(null);
    const [budgetValue, setBudgetValue] = useState('');

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const nextOrder = categories?.length || 0;
        await addCategory({
            name: newName.trim(),
            type: newType,
            color: newColor,
            isDefault: false,
            order: nextOrder
        });

        setNewName('');
        setNewColor('#6366f1');
        setShowNewCategory(false);
        addToast(t(language, 'add') + ' ' + t(language, 'categories') + ' ✓', 'success');
    };

    const handleStartEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setEditName(cat.name);
        setEditType(cat.type);
        setEditColor(cat.color || '#6366f1');
        setEditBudget(cat.budgetLimit ? formatNumber(cat.budgetLimit.toString()) : '');
        setEditHidden(cat.isHidden || false);
    };

    const handleSaveEditCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory || !editName.trim()) return;

        const budgetLimit = editType !== 'income' && editBudget
            ? parseFormattedNumber(editBudget)
            : undefined;

        await db.categories.update(editingCategory.id, {
            name: editName.trim(),
            type: editType,
            color: editColor,
            budgetLimit: budgetLimit && budgetLimit > 0 ? budgetLimit : undefined,
            isHidden: editHidden
        });

        setEditingCategory(null);
        addToast(t(language, 'edit') + ' ' + t(language, 'categories') + ' ✓', 'success');
    };

    const handleToggleHideCategory = async (id: number, currentHidden?: boolean) => {
        await db.categories.update(id, { isHidden: !currentHidden });
        addToast(!currentHidden ? t(language, 'hideCategory') : t(language, 'unhideCategory'), 'info');
    };

    const handleMoveCategory = async (id: number, catType: 'expense' | 'income', direction: 'up' | 'down') => {
        const list = catType === 'expense' ? expenseCategories : incomeCategories;
        const idx = list.findIndex(c => c.id === id);
        if (idx === -1) return;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= list.length) return;

        const updatedList = [...list];
        const temp = updatedList[idx];
        updatedList[idx] = updatedList[targetIdx];
        updatedList[targetIdx] = temp;

        for (let i = 0; i < updatedList.length; i++) {
            await db.categories.update(updatedList[i].id, { order: i });
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (confirm(t(language, 'deleteConfirm'))) {
            await db.categories.delete(id);
            addToast(t(language, 'delete') + ' ✓', 'info');
        }
    };

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const digits = value.replace(/\D/g, '');
        if (digits) {
            setBudgetValue(formatNumber(digits));
        } else {
            setBudgetValue('');
        }
    };

    const handleSetBudget = async (categoryId: number) => {
        const limit = parseFormattedNumber(budgetValue);
        if (limit < 0) return;

        await db.categories.update(categoryId, { budgetLimit: limit || undefined });
        setEditingBudget(null);
        setBudgetValue('');
    };

    const exportData = async (format: 'json' | 'csv') => {
        const transactions = await db.transactions.toArray();
        const cats = await db.categories.toArray();

        let content: string;
        let filename: string;
        let mimeType: string;

        if (format === 'json') {
            content = JSON.stringify({ transactions, categories: cats }, null, 2);
            filename = `spendwise-export-${formatLocalDate(new Date())}.json`;
            mimeType = 'application/json';
        } else {
            const headers = ['ID', 'Type', 'Amount', 'Category', 'Date', 'Note', 'Created At'];
            const rows = transactions.map(tx => {
                const cat = cats.find(c => c.id === tx.categoryId);
                return [
                    tx.id,
                    tx.type,
                    tx.amount,
                    cat?.name || 'Unknown',
                    tx.date,
                    tx.note || '',
                    new Date(tx.createdAt).toISOString()
                ].join(',');
            });
            content = [headers.join(','), ...rows].join('\n');
            filename = `spendwise-export-${formatLocalDate(new Date())}.csv`;
            mimeType = 'text/csv';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        return [...categories]
            .filter(c => showHiddenCategories || !c.isHidden)
            .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
    }, [categories, showHiddenCategories]);

    const expenseCategories = filteredCategories.filter(c => c.type === 'expense' || c.type === 'both');
    const incomeCategories = filteredCategories.filter(c => c.type === 'income' || c.type === 'both');
    const hiddenCatCount = useMemo(() => categories?.filter(c => c.isHidden).length || 0, [categories]);

    if (!categories) {
        return (
            <div className="settings-view">
                <div className="settings-section skeleton" />
            </div>
        );
    }

    return (
        <div className="settings-view tabbed">
            {/* Tab Navigation */}
            <div className="settings-tabs">
                <button className={activeTab === 'appearance' ? 'active' : ''} onClick={() => setActiveTab('appearance')}>
                    <Palette size={16} />
                    <span>{t(language, 'appearance')}</span>
                </button>
                <button className={activeTab === 'features' ? 'active' : ''} onClick={() => setActiveTab('features')}>
                    <Sparkles size={16} />
                    <span>{t(language, 'features')}</span>
                </button>
                <button className={activeTab === 'data' ? 'active' : ''} onClick={() => setActiveTab('data')}>
                    <Database size={16} />
                    <span>{t(language, 'data')}</span>
                </button>
                <button className={activeTab === 'categories' ? 'active' : ''} onClick={() => setActiveTab('categories')}>
                    <FolderOpen size={16} />
                    <span>{t(language, 'categories')}</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="settings-content">
                {/* APPEARANCE TAB */}
                {activeTab === 'appearance' && (
                    <div className="tab-content">
                        <ThemeToggle />
                        <LanguageToggle />
                        <HapticToggle />
                        <CurrencyConverter />
                    </div>
                )}

                {/* FEATURES TAB */}
                {activeTab === 'features' && (
                    <div className="tab-content">
                        {/* Salary Period Setting */}
                        <SalaryDaySetting />

                        {/* Auto-Backup Setting */}
                        <AutoBackupSetting />

                        {/* AI Receipt Scanner */}
                        <AIReceiptSetting />

                        <SavingsGoals />
                        <BillReminders />
                        <QuickTemplates />
                        <SplitTransaction />
                        <RecurringManager />
                    </div>
                )}

                {/* DATA TAB */}
                {activeTab === 'data' && (
                    <div className="tab-content">
                        <CloudBackup />
                        <Reports />

                        {/* Data Export Section */}
                        <section className="settings-section">
                            <h3>{t(language, 'exportData')}</h3>
                            <p className="settings-description">{t(language, 'exportDataDesc')}</p>
                            <div className="export-buttons">
                                <button className="export-btn" onClick={() => exportData('json')}>
                                    <Download size={16} />
                                    {t(language, 'exportJSON')}
                                </button>
                                <button className="export-btn" onClick={() => exportData('csv')}>
                                    <Download size={16} />
                                    {t(language, 'exportCSV')}
                                </button>
                            </div>
                        </section>

                        {/* Data Import Section */}
                        <DataImport />

                        {/* Sample Data Section */}
                        <section className="settings-section">
                            <h3>{t(language, 'sampleData')}</h3>
                            <p className="settings-description">{t(language, 'sampleDataDesc')}</p>
                            <div className="export-buttons">
                                <button className="export-btn" onClick={async () => {
                                    await seedDatabase();
                                    addToast(t(language, 'sampleAdded'), 'success');
                                }}>
                                    <Plus size={16} /> {t(language, 'addSampleTransactions')}
                                </button>
                                <button className="export-btn" onClick={async () => {
                                    await seedAccounts();
                                    addToast(t(language, 'sampleAdded'), 'success');
                                }}>
                                    <Plus size={16} /> {t(language, 'addSampleAccounts')}
                                </button>
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="settings-section danger-zone">
                            <h3><AlertTriangle size={16} /> {t(language, 'dangerZone')}</h3>
                            <p className="settings-description">{t(language, 'clearDataDesc')}</p>
                            <button
                                className="danger-btn"
                                onClick={async () => {
                                    if (confirm(language === 'id' ? 'Apakah Anda yakin ingin menghapus semua data?' : 'Are you sure you want to delete all data?')) {
                                        if (confirm(language === 'id' ? 'Apakah Anda BENAR-BENAR yakin? Semua data akan dihapus permanen!' : 'Are you ABSOLUTELY sure? This will delete all data permanently!')) {
                                            try {
                                                await db.transactions.clear();
                                                await db.recurringTransactions.clear();
                                                await db.accounts.clear();
                                                await db.savingsGoals.clear();
                                                await db.billReminders.clear();
                                                await db.transactionTemplates.clear();
                                                await db.categories.clear();
                                                await seedDatabase();
                                                alert(language === 'id' ? 'Semua data telah dibersihkan. Kategori bawaan dipulihkan.' : 'All data has been cleared. Default categories restored.');
                                            } catch {
                                                alert(language === 'id' ? 'Gagal membersihkan data' : 'Failed to clear data');
                                            }
                                        }
                                    }
                                }}
                            >
                                <Trash2 size={16} />
                                {t(language, 'clearAllData')}
                            </button>
                        </section>
                    </div>
                )}

                {/* CATEGORIES TAB */}
                {activeTab === 'categories' && (
                    <div className="tab-content">
                        <TagManager />
                        <section className="settings-section">
                            <div className="section-header">
                                <div>
                                    <h3>{t(language, 'categories')}</h3>
                                </div>
                                <div className="section-header-actions">
                                    {hiddenCatCount > 0 && (
                                        <button
                                            type="button"
                                            className={`acc-filter-toggle-btn ${showHiddenCategories ? 'active' : ''}`}
                                            onClick={() => setShowHiddenCategories(!showHiddenCategories)}
                                        >
                                            {showHiddenCategories ? <EyeOff size={14} /> : <Eye size={14} />}
                                            <span>
                                                {showHiddenCategories
                                                    ? t(language, 'hideCategory')
                                                    : `${t(language, 'showHiddenCategories')} (${hiddenCatCount})`}
                                            </span>
                                        </button>
                                    )}
                                    <button className="add-category-btn" onClick={() => setShowNewCategory(!showNewCategory)}>
                                        <Plus size={16} />
                                        {t(language, 'add')} {t(language, 'categories')}
                                    </button>
                                </div>
                            </div>

                            {showNewCategory && (
                                <form onSubmit={handleAddCategory} className="new-category-form">
                                    <input
                                        type="text"
                                        placeholder={t(language, 'categoryName')}
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <select value={newType} onChange={(e) => setNewType(e.target.value as 'income' | 'expense')}>
                                        <option value="expense">{t(language, 'expense')}</option>
                                        <option value="income">{t(language, 'income')}</option>
                                    </select>
                                    <input
                                        type="color"
                                        value={newColor}
                                        onChange={(e) => setNewColor(e.target.value)}
                                        className="color-input"
                                    />
                                    <button type="submit" className="submit-btn small">{t(language, 'add')}</button>
                                </form>
                            )}

                            {/* Edit Category Modal */}
                            {editingCategory && (
                                <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
                                    <div className="modal-content compact" onClick={e => e.stopPropagation()}>
                                        <div className="modal-header">
                                            <h3>{t(language, 'editCategory')}</h3>
                                            <button onClick={() => setEditingCategory(null)} className="close-btn">
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <form onSubmit={handleSaveEditCategory} className="edit-category-form">
                                            <div className="form-group">
                                                <label>{t(language, 'categoryName')}</label>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    placeholder="Category Name"
                                                    required
                                                    className="form-input"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t(language, 'type')}</label>
                                                <select
                                                    value={editType}
                                                    onChange={(e) => setEditType(e.target.value as 'income' | 'expense' | 'both')}
                                                    className="form-select"
                                                >
                                                    <option value="expense">{t(language, 'expense')}</option>
                                                    <option value="income">{t(language, 'income')}</option>
                                                    <option value="both">Both (Income & Expense)</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>{t(language, 'color')}</label>
                                                <div className="color-picker-row">
                                                    <input
                                                        type="color"
                                                        value={editColor}
                                                        onChange={(e) => setEditColor(e.target.value)}
                                                        className="color-input"
                                                    />
                                                    <div className="preset-colors">
                                                        {PRESET_COLORS.map(c => (
                                                            <button
                                                                key={c}
                                                                type="button"
                                                                className={`color-dot-btn ${editColor === c ? 'active' : ''}`}
                                                                style={{ backgroundColor: c }}
                                                                onClick={() => setEditColor(c)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            {editType !== 'income' && (
                                                <div className="form-group">
                                                    <label>Monthly Budget Limit (optional)</label>
                                                    <div className="input-prefix-wrapper">
                                                        <span className="input-prefix">Rp</span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="0"
                                                            value={editBudget}
                                                            onChange={(e) => {
                                                                const digits = e.target.value.replace(/\D/g, '');
                                                                setEditBudget(digits ? formatNumber(digits) : '');
                                                            }}
                                                            className="form-input"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="form-group-checkboxes">
                                                <label className="custom-checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={editHidden}
                                                        onChange={e => setEditHidden(e.target.checked)}
                                                    />
                                                    <span>👁️ {t(language, 'hideCategory')}</span>
                                                </label>
                                            </div>
                                            <div className="modal-actions">
                                                <button type="button" onClick={() => setEditingCategory(null)} className="cancel-btn">
                                                    {t(language, 'cancel')}
                                                </button>
                                                <button type="submit" className="submit-btn">
                                                    {t(language, 'save')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="category-group">
                                <h4>{t(language, 'expenseCategories')}</h4>
                                <ul className="category-list">
                                    {expenseCategories.map((cat, idx) => (
                                        <li key={cat.id} className={`category-item ${cat.isHidden ? 'is-hidden-category' : ''}`}>
                                            <div className="category-info">
                                                <span className="category-color" style={{ backgroundColor: cat.color }} />
                                                <span className="category-name">{cat.name}</span>
                                                {cat.isDefault && <span className="default-badge">{t(language, 'defaultBadge')}</span>}
                                                {cat.isHidden && <span className="hidden-pill-badge">{t(language, 'hidden')}</span>}
                                            </div>
                                            <div className="category-actions">
                                                {/* Reorder Buttons */}
                                                <button
                                                    onClick={() => handleMoveCategory(cat.id, 'expense', 'up')}
                                                    disabled={idx === 0}
                                                    className="cat-icon-btn move"
                                                    title={t(language, 'moveUp')}
                                                >
                                                    <ChevronUp size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveCategory(cat.id, 'expense', 'down')}
                                                    disabled={idx === expenseCategories.length - 1}
                                                    className="cat-icon-btn move"
                                                    title={t(language, 'moveDown')}
                                                >
                                                    <ChevronDown size={13} />
                                                </button>

                                                {/* Hide / Unhide Button */}
                                                <button
                                                    onClick={() => handleToggleHideCategory(cat.id, cat.isHidden)}
                                                    className={`cat-icon-btn hide ${cat.isHidden ? 'is-hidden-btn' : ''}`}
                                                    title={cat.isHidden ? t(language, 'unhideCategory') : t(language, 'hideCategory')}
                                                >
                                                    {cat.isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                                                </button>

                                                {editingBudget === cat.id ? (
                                                    <div className="budget-edit">
                                                        <span className="budget-prefix">Rp</span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="0"
                                                            value={budgetValue}
                                                            onChange={handleBudgetChange}
                                                        />
                                                        <button onClick={() => handleSetBudget(cat.id)} className="save-budget-btn">{t(language, 'save')}</button>
                                                        <button onClick={() => setEditingBudget(null)} className="cancel-btn">×</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="set-budget-btn"
                                                            onClick={() => {
                                                                setEditingBudget(cat.id);
                                                                setBudgetValue(cat.budgetLimit ? formatNumber(cat.budgetLimit.toString()) : '');
                                                            }}
                                                        >
                                                            {cat.budgetLimit ? formatCurrency(cat.budgetLimit) : 'Set Budget'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleStartEditCategory(cat)}
                                                            className="edit-cat-btn"
                                                            title="Edit Category"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteCategory(cat.id)} className="delete-cat-btn" title="Delete Category">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="category-group">
                                <h4>{t(language, 'incomeCategories')}</h4>
                                <ul className="category-list">
                                    {incomeCategories.map((cat, idx) => (
                                        <li key={cat.id} className={`category-item ${cat.isHidden ? 'is-hidden-category' : ''}`}>
                                            <div className="category-info">
                                                <span className="category-color" style={{ backgroundColor: cat.color }} />
                                                <span className="category-name">{cat.name}</span>
                                                {cat.isDefault && <span className="default-badge">{t(language, 'defaultBadge')}</span>}
                                                {cat.isHidden && <span className="hidden-pill-badge">{t(language, 'hidden')}</span>}
                                            </div>
                                            <div className="category-actions">
                                                {/* Reorder Buttons */}
                                                <button
                                                    onClick={() => handleMoveCategory(cat.id, 'income', 'up')}
                                                    disabled={idx === 0}
                                                    className="cat-icon-btn move"
                                                    title={t(language, 'moveUp')}
                                                >
                                                    <ChevronUp size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveCategory(cat.id, 'income', 'down')}
                                                    disabled={idx === incomeCategories.length - 1}
                                                    className="cat-icon-btn move"
                                                    title={t(language, 'moveDown')}
                                                >
                                                    <ChevronDown size={13} />
                                                </button>

                                                {/* Hide / Unhide Button */}
                                                <button
                                                    onClick={() => handleToggleHideCategory(cat.id, cat.isHidden)}
                                                    className={`cat-icon-btn hide ${cat.isHidden ? 'is-hidden-btn' : ''}`}
                                                    title={cat.isHidden ? t(language, 'unhideCategory') : t(language, 'hideCategory')}
                                                >
                                                    {cat.isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                                                </button>

                                                <button
                                                    onClick={() => handleStartEditCategory(cat)}
                                                    className="edit-cat-btn"
                                                    title="Edit Category"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="delete-cat-btn" title="Delete Category">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

// Salary Day Setting Component
function SalaryDaySetting() {
    const { salaryDay, setSalaryDay } = useStore();
    const [showDayGrid, setShowDayGrid] = useState(false);

    const QUICK_PRESETS = [1, 15, 20, 25, 28, 31];

    const handleSelectDay = (day: number) => {
        const validDay = Math.min(31, Math.max(1, day));
        setSalaryDay(validDay);
    };

    const handlePrevDay = () => {
        setSalaryDay(salaryDay <= 1 ? 31 : salaryDay - 1);
    };

    const handleNextDay = () => {
        setSalaryDay(salaryDay >= 31 ? 1 : salaryDay + 1);
    };

    return (
        <section className="settings-section salary-day-section">
            <div className="section-header">
                <h3>💰 Salary Period</h3>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 500 }}>✓ DB Synced</span>
            </div>
            <p className="settings-description">
                Select the day of the month your salary is received to align your spending period.
            </p>

            <div className="salary-picker-container">
                {/* Stepper + Select Picker */}
                <div className="salary-stepper">
                    <button
                        type="button"
                        onClick={handlePrevDay}
                        className="stepper-btn"
                        title="Previous Day"
                    >
                        −
                    </button>

                    <div className="salary-select-wrapper">
                        <select
                            value={salaryDay}
                            onChange={(e) => handleSelectDay(Number(e.target.value))}
                            className="salary-dropdown-picker"
                        >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <option key={day} value={day}>
                                    Day {day} {day === 1 ? '(1st)' : day === 25 ? '(25th - Popular)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={handleNextDay}
                        className="stepper-btn"
                        title="Next Day"
                    >
                        +
                    </button>
                </div>

                {/* Quick Presets */}
                <div className="salary-presets">
                    <span className="presets-label">Quick select:</span>
                    <div className="preset-chips">
                        {QUICK_PRESETS.map((day) => (
                            <button
                                key={day}
                                type="button"
                                className={`preset-chip ${salaryDay === day ? 'active' : ''}`}
                                onClick={() => handleSelectDay(day)}
                            >
                                Day {day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Day Grid Toggle */}
                <button
                    type="button"
                    className="toggle-grid-btn"
                    onClick={() => setShowDayGrid(!showDayGrid)}
                >
                    <Calendar size={14} />
                    {showDayGrid ? 'Hide Day Grid' : 'Show All 31 Days'}
                </button>

                {showDayGrid && (
                    <div className="days-31-grid">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <button
                                key={day}
                                type="button"
                                className={`day-grid-cell ${salaryDay === day ? 'active' : ''}`}
                                onClick={() => handleSelectDay(day)}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

// Auto-Backup Setting Component
function AutoBackupSetting() {
    const { autoBackupEnabled, autoBackupTime, setAutoBackupEnabled, setAutoBackupTime } = useStore();

    return (
        <section className="settings-section">
            <h3>☁️ Auto-Backup</h3>
            <p className="settings-description">
                Automatically backup your data at a scheduled time (works while app is open).
            </p>
            <div className="setting-row">
                <label>Enable Auto-Backup</label>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={autoBackupEnabled}
                        onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                    />
                    <span className="slider"></span>
                </label>
            </div>
            {autoBackupEnabled && (
                <div className="setting-row">
                    <label>Backup Time</label>
                    <input
                        type="time"
                        value={autoBackupTime}
                        onChange={(e) => setAutoBackupTime(e.target.value)}
                        className="backup-time-input"
                    />
                </div>
            )}
        </section>
    );
}

// AI Receipt Scanner Setting Component
function AIReceiptSetting() {
    const { aiProvider, aiApiKey, aiModel, openaiBaseUrl, cachedModels, setAiProvider, setAiApiKey, setAiModel, setOpenaiBaseUrl, setCachedModels } = useStore();
    const [showKey, setShowKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Available vision models for each provider
    const AI_MODELS = {
        openai: [
            { id: 'gpt-5', name: 'GPT-5 (Latest)' },
            { id: 'o4-mini', name: 'o4-mini (Fast Reasoning)' },
            { id: 'gpt-4o', name: 'GPT-4o' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        ],
        gemini: [
            { id: 'gemini-3-flash', name: 'Gemini 3 Flash (Latest)' },
            { id: 'gemini-3-pro', name: 'Gemini 3 Pro' },
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
        ]
    };

    // Use cached models if available, otherwise use defaults
    const availableModels = cachedModels[aiProvider]?.length > 0
        ? cachedModels[aiProvider]
        : AI_MODELS[aiProvider];

    const handleRefreshModels = async () => {
        if (!aiApiKey) {
            alert('Please enter an API key first');
            return;
        }
        setIsLoading(true);
        try {
            const { fetchAvailableModels } = await import('../utils/receiptScanner');
            const models = await fetchAvailableModels(aiProvider, aiApiKey);
            setCachedModels(aiProvider, models);
            if (!models.find(m => m.id === aiModel)) {
                setAiModel(models[0]?.id || '');
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
            alert('Failed to fetch models. Check your API key.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="settings-section">
            <h3>📷 AI Receipt Scanner</h3>
            <p className="settings-description">
                Use AI to automatically extract transaction data from receipt photos.
            </p>
            <div className="setting-row">
                <label>AI Provider</label>
                <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as 'openai' | 'gemini')}
                    className="ai-provider-select"
                >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                </select>
            </div>
            <div className="setting-row">
                <label>Model</label>
                <div className="model-select-wrapper">
                    <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="ai-provider-select"
                    >
                        {availableModels.map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleRefreshModels}
                        disabled={isLoading || !aiApiKey}
                        className="refresh-models-btn"
                        title="Refresh available models from API"
                    >
                        {isLoading ? '⏳' : '🔄'}
                    </button>
                </div>
            </div>
            <div className="setting-row api-key-row">
                <label>API Key</label>
                <div className="api-key-input-wrapper">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder={`Enter ${aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'} API key`}
                        className="api-key-input"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="toggle-key-btn"
                    >
                        {showKey ? '🙈' : '👁️'}
                    </button>
                </div>
            </div>
            {aiProvider === 'openai' && (
                <div className="setting-row api-key-row">
                    <label>Base URL</label>
                    <input
                        type="text"
                        value={openaiBaseUrl}
                        onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="api-key-input"
                    />
                </div>
            )}
            <p className="settings-hint">
                {aiProvider === 'gemini'
                    ? 'Get your API key from Google AI Studio'
                    : 'Get your API key from OpenAI Platform'}
            </p>
        </section>
    );
}
