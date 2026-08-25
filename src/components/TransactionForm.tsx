import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { useToast } from '../store/useToast';
import { formatNumber, parseFormattedNumber } from '../utils/currency';
import { formatLocalDate } from '../utils/dateUtils';
import { scanReceipt } from '../utils/receiptScanner';
import TagInput from './TagInput';
import NoteAutocomplete from './NoteAutocomplete';
import { Camera, Loader, Upload } from 'lucide-react';
import { t } from '../i18n/translations';
import type { NoteHistoryItem } from './NoteAutocomplete';

interface TransactionFormProps {
    onSuccess?: () => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
    const { addTransaction, updateTransaction, editingTransaction, setEditingTransaction, aiProvider, aiApiKey, aiModel, openaiBaseUrl, language } = useStore();
    const { addToast } = useToast();
    const categories = useLiveQuery(() => db.categories.toArray());
    const accounts = useLiveQuery(() => db.accounts.toArray());
    // Load all transactions for note autocomplete history mining
    const allTransactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []);
    const fileInputRef = useRef<HTMLInputElement>(null); // Camera capture
    const galleryInputRef = useRef<HTMLInputElement>(null); // Gallery upload

    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(formatLocalDate(new Date()));
    const [tags, setTags] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    // Build note history from past transactions: group by normalized note, count occurrences
    const noteHistory = useMemo<NoteHistoryItem[]>(() => {
        if (!allTransactions || !categories) return [];
        const map = new Map<string, NoteHistoryItem>();

        for (const tx of allTransactions) {
            const raw = tx.note?.trim();
            if (!raw) continue;

            // Normalize note: lowercase key for grouping
            const key = raw.toLowerCase();
            const cat = categories.find(c => c.id === tx.categoryId);

            if (map.has(key)) {
                const existing = map.get(key)!;
                existing.count += 1;
                // Keep the canonical (most recent) casing
            } else {
                map.set(key, {
                    note: raw,
                    count: 1,
                    lastUsed: tx.date,
                    lastAmount: tx.amount,
                    categoryId: tx.categoryId,
                    categoryName: cat?.name,
                    categoryColor: cat?.color,
                });
            }
        }

        // Sort by usage count desc, then by lastUsed desc
        return Array.from(map.values()).sort(
            (a, b) => b.count - a.count || b.lastUsed.localeCompare(a.lastUsed)
        );
    }, [allTransactions, categories]);

    // Set default account for new transactions only
    useEffect(() => {
        if (!editingTransaction && accounts && accounts.length > 0 && !accountId) {
            const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
            setAccountId(defaultAcc.id.toString());
        }
    }, [accounts, accountId, editingTransaction]);

    // Populate form when editing
    useEffect(() => {
        if (editingTransaction) {
            setAmount(formatNumber(editingTransaction.amount.toString()));
            setCategoryId(editingTransaction.categoryId.toString());
            setAccountId(editingTransaction.accountId?.toString() || '');
            setType(editingTransaction.type);
            setNote(editingTransaction.note || '');
            setDate(editingTransaction.date);
            setTags(editingTransaction.tags || []);
        }
    }, [editingTransaction]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const digits = value.replace(/\D/g, '');
        if (digits) {
            setAmount(formatNumber(digits));
        } else {
            setAmount('');
        }
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numericAmount = parseFormattedNumber(amount);

        if (numericAmount <= 0) {
            setError(t(language, 'amountError'));
            return;
        }

        if (!categoryId) {
            setError(t(language, 'categoryError'));
            return;
        }

        if (editingTransaction) {
            await updateTransaction(editingTransaction.id, {
                amount: numericAmount,
                categoryId: parseInt(categoryId),
                accountId: accountId ? parseInt(accountId) : undefined,
                type,
                note,
                date,
                tags: tags.length > 0 ? tags : undefined
            });
            addToast(t(language, 'transactionUpdated'), 'success');
        } else {
            await addTransaction({
                amount: numericAmount,
                categoryId: parseInt(categoryId),
                accountId: accountId ? parseInt(accountId) : undefined,
                type,
                note,
                date,
                tags: tags.length > 0 ? tags : undefined
            });
            addToast(t(language, 'transactionAdded'), 'success');
        }

        resetForm();
        onSuccess?.();
    };

    const resetForm = () => {
        setAmount('');
        setCategoryId('');
        setType('expense');
        setNote('');
        setDate(formatLocalDate(new Date()));
        setTags([]);
        setEditingTransaction(null);
        setError('');
    };

    const handleCancel = () => {
        resetForm();
    };

    const handleScanReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!aiApiKey) {
            addToast(t(language, 'configureApiKey'), 'error');
            return;
        }

        setIsScanning(true);
        setError('');

        try {
            const data = await scanReceipt(file, aiProvider, aiApiKey, aiModel, openaiBaseUrl);

            // Auto-fill form with extracted data
            if (data.totalAmount !== null) {
                setAmount(formatNumber(data.totalAmount.toString()));
            }
            if (data.date) {
                setDate(data.date);
            }
            if (data.merchant || data.items) {
                setNote([data.merchant, data.items].filter(Boolean).join(' - '));
            }
            if (data.suggestedCategory && categories) {
                // Try to match category by name
                const matchedCategory = categories.find(
                    c => c.name.toLowerCase().includes(data.suggestedCategory!.toLowerCase()) ||
                        data.suggestedCategory!.toLowerCase().includes(c.name.toLowerCase())
                );
                if (matchedCategory) {
                    setCategoryId(matchedCategory.id.toString());
                }
            }

            addToast(t(language, 'scanReceipt') + ' ✓', 'success');
        } catch (err) {
            console.error('Receipt scan error:', err);
            setError(err instanceof Error ? err.message : t(language, 'failedToScan'));
            addToast(t(language, 'failedToScan'), 'error');
        } finally {
            setIsScanning(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (!categories) return null;

    const isEditing = !!editingTransaction;
    const filteredCategories = categories.filter(c => c.type === type || c.type === 'both');

    return (
        <form onSubmit={handleSubmit} className="transaction-form">
            {isEditing && (
                <div className="edit-banner">
                    {t(language, 'editingTransactionBanner')}
                    <button type="button" onClick={handleCancel} className="cancel-edit-btn">{t(language, 'cancel')}</button>
                </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
                <div className="segmented-control">
                    <button
                        type="button"
                        className={type === 'expense' ? 'active-expense' : ''}
                        onClick={() => setType('expense')}
                    >
                        {t(language, 'expense')}
                    </button>
                    <button
                        type="button"
                        className={type === 'income' ? 'active-income' : ''}
                        onClick={() => setType('income')}
                    >
                        {t(language, 'income')}
                    </button>
                </div>
            </div>

            <div className="form-group">
                <div className="amount-input-wrapper">
                    <span className="currency-prefix">Rp</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={amount}
                        onChange={handleAmountChange}
                        className="amount-input"
                        required
                    />
                    <button
                        type="button"
                        className="scan-receipt-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                        title={t(language, 'scanReceipt')}
                    >
                        {isScanning ? <Loader size={18} className="spin" /> : <Camera size={18} />}
                    </button>
                    <button
                        type="button"
                        className="scan-receipt-btn upload-btn"
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={isScanning}
                        title={t(language, 'scanReceipt')}
                    >
                        <Upload size={18} />
                    </button>
                    {/* Camera capture input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleScanReceipt}
                        style={{ display: 'none' }}
                    />
                    {/* Gallery upload input (no capture attribute) */}
                    <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScanReceipt}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            <div className="form-row two-col">
                <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                >
                    <option value="" disabled>{t(language, 'selectCategory')}</option>
                    {filteredCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                {accounts && accounts.length > 0 && (
                    <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                    >
                        {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="form-row two-col">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <NoteAutocomplete
                    value={note}
                    onChange={setNote}
                    history={noteHistory}
                    placeholder={t(language, 'noteOptional')}
                    language={language}
                    onSelectSuggestion={(item) => {
                        // Auto-prefill category if not yet chosen and the suggested item has a valid category for current type
                        if (!categoryId && item.categoryId) {
                            const matchedCat = categories?.find(
                                c => c.id === item.categoryId && (c.type === type || c.type === 'both')
                            );
                            if (matchedCat) setCategoryId(matchedCat.id.toString());
                        }
                    }}
                />
            </div>

            <div className="form-group">
                <TagInput value={tags} onChange={setTags} />
            </div>

            <button type="submit" className="submit-btn">
                {isEditing ? t(language, 'updateTransaction') : t(language, 'addTransaction')}
            </button>
        </form>
    );
}
