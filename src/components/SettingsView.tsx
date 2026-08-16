import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Category } from '../db/db';
import { useStore } from '../store/useStore';
import { useToast } from '../store/useToast';
import { Download, Plus, Trash2, Pencil, X, AlertTriangle, Palette, Database, Sparkles, FolderOpen } from 'lucide-react';
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

type SettingsTab = 'appearance' | 'features' | 'data' | 'categories';

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f59e0b', '#10b981', '#14b8a6', '#3b82f6', '#64748b'
];

export default function SettingsView() {
    const { addCategory } = useStore();
    const { addToast } = useToast();
    const categories = useLiveQuery(() => db.categories.toArray());
    const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

    // New category form state
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'income' | 'expense'>('expense');
    const [newColor, setNewColor] = useState('#6366f1');

    // Edit category state
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState<'income' | 'expense' | 'both'>('expense');
    const [editColor, setEditColor] = useState('#6366f1');
    const [editBudget, setEditBudget] = useState('');

    // Budget inline editing state
    const [editingBudget, setEditingBudget] = useState<number | null>(null);
    const [budgetValue, setBudgetValue] = useState('');

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        await addCategory({
            name: newName.trim(),
            type: newType,
            color: newColor,
            isDefault: false
        });

        setNewName('');
        setNewColor('#6366f1');
        setShowNewCategory(false);
        addToast('Category added!', 'success');
    };

    const handleStartEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setEditName(cat.name);
        setEditType(cat.type);
        setEditColor(cat.color || '#6366f1');
        setEditBudget(cat.budgetLimit ? formatNumber(cat.budgetLimit.toString()) : '');
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
            budgetLimit: budgetLimit && budgetLimit > 0 ? budgetLimit : undefined
        });

        setEditingCategory(null);
        addToast('Category updated!', 'success');
    };

    const handleDeleteCategory = async (id: number) => {
        if (confirm('Delete this category? Transactions using it will keep their category reference.')) {
            await db.categories.delete(id);
            addToast('Category deleted', 'info');
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

    if (!categories) {
        return (
            <div className="settings-view">
                <div className="settings-section skeleton" />
            </div>
        );
    }

    const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');
    const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both');

    return (
        <div className="settings-view tabbed">
            {/* Tab Navigation */}
            <div className="settings-tabs">
                <button
                    className={activeTab === 'appearance' ? 'active' : ''}
                    onClick={() => setActiveTab('appearance')}
                >
                    <Palette size={16} />
                    <span>Appearance</span>
                </button>
                <button
                    className={activeTab === 'features' ? 'active' : ''}
                    onClick={() => setActiveTab('features')}
                >
                    <Sparkles size={16} />
                    <span>Features</span>
                </button>
                <button
                    className={activeTab === 'data' ? 'active' : ''}
                    onClick={() => setActiveTab('data')}
                >
                    <Database size={16} />
                    <span>Data</span>
                </button>
                <button
                    className={activeTab === 'categories' ? 'active' : ''}
                    onClick={() => setActiveTab('categories')}
                >
                    <FolderOpen size={16} />
                    <span>Categories</span>
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
                            <h3>Export Data</h3>
                            <p className="settings-description">Download all your transactions and categories.</p>
                            <div className="export-buttons">
                                <button className="export-btn" onClick={() => exportData('json')}>
                                    <Download size={16} />
                                    Export JSON
                                </button>
                                <button className="export-btn" onClick={() => exportData('csv')}>
                                    <Download size={16} />
                                    Export CSV
                                </button>
                            </div>
                        </section>

                        {/* Data Import Section */}
                        <DataImport />

                        {/* Sample Data Section */}
                        <section className="settings-section">
                            <h3>Sample Data</h3>
                            <p className="settings-description">Generate sample data for testing (will add to existing data).</p>
                            <div className="export-buttons">
                                <button className="export-btn" onClick={async () => {
                                    await seedDatabase();
                                    alert('Sample transactions added!');
                                }}>
                                    <Plus size={16} /> Add Sample Transactions
                                </button>
                                <button className="export-btn" onClick={async () => {
                                    await seedAccounts();
                                    alert('Sample accounts added!');
                                }}>
                                    <Plus size={16} /> Add Sample Accounts
                                </button>
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="settings-section danger-zone">
                            <h3><AlertTriangle size={16} /> Danger Zone</h3>
                            <p className="settings-description">Permanently delete all your data.</p>
                            <button
                                className="danger-btn"
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete all data?')) {
                                        if (confirm('Are you ABSOLUTELY sure? This will delete ALL transactions, recurring transactions, and custom categories!')) {
                                            try {
                                                await db.transactions.clear();
                                                await db.recurringTransactions.clear();
                                                await db.accounts.clear();
                                                await db.savingsGoals.clear();
                                                await db.billReminders.clear();
                                                await db.transactionTemplates.clear();
                                                await db.categories.clear();
                                                await seedDatabase();
                                                alert('All data has been cleared. Default categories restored.');
                                            } catch {
                                                alert('Failed to clear data');
                                            }
                                        }
                                    }
                                }}
                            >
                                <Trash2 size={16} />
                                Clear All Data
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
                                <h3>Categories</h3>
                                <button className="add-category-btn" onClick={() => setShowNewCategory(!showNewCategory)}>
                                    <Plus size={16} />
                                    Add Category
                                </button>
                            </div>

                            {showNewCategory && (
                                <form onSubmit={handleAddCategory} className="new-category-form">
                                    <input
                                        type="text"
                                        placeholder="Category name"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        required
                                    />
                                    <select value={newType} onChange={(e) => setNewType(e.target.value as 'income' | 'expense')}>
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                    <input
                                        type="color"
                                        value={newColor}
                                        onChange={(e) => setNewColor(e.target.value)}
                                        className="color-input"
                                    />
                                    <button type="submit" className="submit-btn small">Add</button>
                                </form>
                            )}

                            {/* Edit Category Modal */}
                            {editingCategory && (
                                <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
                                    <div className="modal-content compact" onClick={e => e.stopPropagation()}>
                                        <div className="modal-header">
                                            <h3>Edit Category</h3>
                                            <button onClick={() => setEditingCategory(null)} className="close-btn">
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <form onSubmit={handleSaveEditCategory} className="edit-category-form">
                                            <div className="form-group">
                                                <label>Category Name</label>
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
                                                <label>Type</label>
                                                <select
                                                    value={editType}
                                                    onChange={(e) => setEditType(e.target.value as 'income' | 'expense' | 'both')}
                                                    className="form-select"
                                                >
                                                    <option value="expense">Expense</option>
                                                    <option value="income">Income</option>
                                                    <option value="both">Both (Income & Expense)</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Color</label>
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
                                            <div className="modal-actions">
                                                <button type="button" onClick={() => setEditingCategory(null)} className="cancel-btn">
                                                    Cancel
                                                </button>
                                                <button type="submit" className="submit-btn">
                                                    Save Changes
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="category-group">
                                <h4>Expense Categories</h4>
                                <ul className="category-list">
                                    {expenseCategories.map(cat => (
                                        <li key={cat.id} className="category-item">
                                            <div className="category-info">
                                                <span className="category-color" style={{ backgroundColor: cat.color }} />
                                                <span className="category-name">{cat.name}</span>
                                                {cat.isDefault && <span className="default-badge">Default</span>}
                                            </div>
                                            <div className="category-actions">
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
                                                        <button onClick={() => handleSetBudget(cat.id)} className="save-budget-btn">Save</button>
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
                                <h4>Income Categories</h4>
                                <ul className="category-list">
                                    {incomeCategories.map(cat => (
                                        <li key={cat.id} className="category-item">
                                            <div className="category-info">
                                                <span className="category-color" style={{ backgroundColor: cat.color }} />
                                                <span className="category-name">{cat.name}</span>
                                                {cat.isDefault && <span className="default-badge">Default</span>}
                                            </div>
                                            <div className="category-actions">
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

    return (
        <section className="settings-section">
            <h3>💰 Salary Period</h3>
            <p className="settings-description">
                Set your salary day to track spending between paydays. Automatically synced across devices via database.
            </p>
            <div className="setting-row">
                <label>Salary Day (1-31)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        value={salaryDay}
                        onChange={(e) => setSalaryDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="salary-day-input"
                    />
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 500 }}>✓ DB Synced</span>
                </div>
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
