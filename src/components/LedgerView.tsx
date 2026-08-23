import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LedgerItem, type LedgerPayment } from '../db/db';
import { useToast } from '../store/useToast';
import { useStore } from '../store/useStore';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/currency';
import { formatLocalDate } from '../utils/dateUtils';
import {
    getLedgerPaidAmount,
    getLedgerRemainingAmount,
    getLedgerProgressPercent,
    getLedgerStatus
} from '../utils/ledgerUtils';
import {
    BookOpen,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    ArrowDownLeft,
    ArrowUpRight,
    Calendar,
    Wallet,
    History,
    CreditCard,
    ChevronDown,
    ChevronUp,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { t } from '../i18n/translations';

type StatusFilter = 'active' | 'all' | 'settled';

export default function LedgerView() {
    const { addToast } = useToast();
    const { language } = useStore();

    // Database live queries
    const ledgerItems = useLiveQuery(() => db.ledger.orderBy('createdAt').reverse().toArray());
    const accounts = useLiveQuery(() => db.accounts.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    // Navigation & filter states
    const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
    const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

    // Add / Edit Modal state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [personName, setPersonName] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [accountId, setAccountId] = useState('');
    const [recordTransaction, setRecordTransaction] = useState(true);

    // Payment Modal state
    const [payingItem, setPayingItem] = useState<LedgerItem | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentAccountId, setPaymentAccountId] = useState('');
    const [paymentDate, setPaymentDate] = useState(formatLocalDate(new Date()));
    const [paymentNote, setPaymentNote] = useState('');
    const [recordPaymentTransaction, setRecordPaymentTransaction] = useState(true);

    const getAccount = (id?: number) => accounts?.find(a => a.id === id);

    // Reset Add/Edit form
    const resetForm = () => {
        setPersonName('');
        setAmount('');
        setNote('');
        setDueDate('');
        setAccountId(accounts && accounts.length > 0 ? accounts[0].id.toString() : '');
        setRecordTransaction(true);
        setShowForm(false);
        setEditingId(null);
    };

    // Open Add Form
    const handleOpenAddForm = () => {
        resetForm();
        if (accounts && accounts.length > 0) {
            const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
            setAccountId(defaultAcc.id.toString());
        }
        setShowForm(true);
    };

    // Open Edit Form
    const handleEdit = (item: LedgerItem) => {
        setPersonName(item.personName);
        setAmount(formatNumber(item.amount.toString()));
        setNote(item.note || '');
        setDueDate(item.dueDate || '');
        setAccountId(item.accountId ? item.accountId.toString() : '');
        setRecordTransaction(false); // don't duplicate transaction on edit
        setEditingId(item.id!);
        setActiveTab(item.type);
        setShowForm(true);
    };

    // Open Payment Modal
    const handleOpenPaymentModal = (item: LedgerItem) => {
        const remaining = getLedgerRemainingAmount(item);
        setPayingItem(item);
        setPaymentAmount(formatNumber(remaining.toString()));
        setPaymentDate(formatLocalDate(new Date()));
        setPaymentNote('');
        setRecordPaymentTransaction(true);
        if (accounts && accounts.length > 0) {
            const defaultAcc = item.accountId
                ? accounts.find(a => a.id === item.accountId)
                : accounts.find(a => a.isDefault) || accounts[0];
            setPaymentAccountId(defaultAcc ? defaultAcc.id.toString() : accounts[0].id.toString());
        } else {
            setPaymentAccountId('');
        }
    };

    const handleClosePaymentModal = () => {
        setPayingItem(null);
        setPaymentAmount('');
        setPaymentNote('');
    };

    // Preset payment amount helper
    const setPresetAmount = (percentage: number) => {
        if (!payingItem) return;
        const remaining = getLedgerRemainingAmount(payingItem);
        const calcAmount = Math.round(remaining * percentage);
        setPaymentAmount(formatNumber(calcAmount.toString()));
    };

    // Submit Add / Edit Ledger item
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!personName.trim()) {
            addToast(language === 'id' ? 'Masukkan nama orang atau perusahaan' : 'Please enter a name', 'error');
            return;
        }
        const parsedAmount = parseFormattedNumber(amount);
        if (parsedAmount <= 0) {
            addToast(t(language, 'amountError'), 'error');
            return;
        }

        const selectedAccId = accountId ? parseInt(accountId) : undefined;

        if (editingId) {
            // Update existing
            const existingItem = ledgerItems?.find(i => i.id === editingId);
            const updatedData: Partial<LedgerItem> = {
                personName: personName.trim(),
                amount: parsedAmount,
                note: note.trim() || undefined,
                dueDate: dueDate || undefined,
                accountId: selectedAccId
            };

            // Recalculate isPaid status based on existing payments and new amount
            if (existingItem) {
                const paidSoFar = getLedgerPaidAmount(existingItem);
                if (paidSoFar >= parsedAmount) {
                    updatedData.isPaid = true;
                    if (!existingItem.isPaid) updatedData.paidAt = Date.now();
                } else {
                    updatedData.isPaid = false;
                    updatedData.paidAt = undefined;
                }

                // If initial transaction exists, update its amount & note
                if (existingItem.initialTransactionId) {
                    try {
                        await db.transactions.update(existingItem.initialTransactionId, {
                            amount: parsedAmount,
                            note: `${activeTab === 'receivable' ? 'Loan to' : 'Loan from'} ${personName.trim()}${note.trim() ? ': ' + note.trim() : ''}`,
                            accountId: selectedAccId
                        });
                    } catch (err) {
                        console.warn('Could not update initial transaction:', err);
                    }
                }
            }

            await db.ledger.update(editingId, updatedData);
            addToast(t(language, 'transactionUpdated'), 'success');
        } else {
            // Create new
            let initialTxId: number | undefined = undefined;

            if (recordTransaction && selectedAccId && categories) {
                // Find or use a category
                const txType = activeTab === 'receivable' ? 'expense' : 'income';
                const defaultCat = categories.find(c => c.type === txType || c.type === 'both');
                if (defaultCat) {
                    initialTxId = await db.transactions.add({
                        type: txType,
                        amount: parsedAmount,
                        categoryId: defaultCat.id,
                        accountId: selectedAccId,
                        date: formatLocalDate(new Date()),
                        note: `${activeTab === 'receivable' ? 'Loan to' : 'Loan from'} ${personName.trim()}${note.trim() ? ': ' + note.trim() : ''}`,
                        createdAt: Date.now()
                    });
                }
            }

            const data: Omit<LedgerItem, 'id'> = {
                type: activeTab,
                personName: personName.trim(),
                amount: parsedAmount,
                note: note.trim() || undefined,
                dueDate: dueDate || undefined,
                isPaid: false,
                createdAt: Date.now(),
                accountId: selectedAccId,
                initialTransactionId: initialTxId,
                payments: []
            };

            await db.ledger.add(data);
            addToast(t(language, 'transactionAdded'), 'success');
        }

        resetForm();
    };

    // Submit Payment (Partial or Full Settlement)
    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payingItem || !payingItem.id) return;

        const parsedAmount = parseFormattedNumber(paymentAmount);
        const remaining = getLedgerRemainingAmount(payingItem);

        if (parsedAmount <= 0 || parsedAmount > remaining) {
            addToast(t(language, 'paymentAmountError'), 'error');
            return;
        }

        const selectedAccId = paymentAccountId ? parseInt(paymentAccountId) : undefined;
        let paymentTxId: number | undefined = undefined;

        // Optionally create transaction in db.transactions
        if (recordPaymentTransaction && selectedAccId && categories) {
            const txType = payingItem.type === 'receivable' ? 'income' : 'expense';
            const defaultCat = categories.find(c => c.type === txType || c.type === 'both');
            if (defaultCat) {
                const txNote = payingItem.type === 'receivable'
                    ? `Debt repayment from ${payingItem.personName}${paymentNote ? ' - ' + paymentNote : ''}`
                    : `Debt payment to ${payingItem.personName}${paymentNote ? ' - ' + paymentNote : ''}`;

                paymentTxId = await db.transactions.add({
                    type: txType,
                    amount: parsedAmount,
                    categoryId: defaultCat.id,
                    accountId: selectedAccId,
                    date: paymentDate || formatLocalDate(new Date()),
                    note: txNote,
                    createdAt: Date.now()
                });
            }
        }

        const newPayment: LedgerPayment = {
            id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            amount: parsedAmount,
            date: paymentDate || formatLocalDate(new Date()),
            accountId: selectedAccId,
            transactionId: paymentTxId,
            note: paymentNote.trim() || undefined,
            createdAt: Date.now()
        };

        const existingPayments = payingItem.payments || [];
        const updatedPayments = [...existingPayments, newPayment];
        const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const isNowFullyPaid = newTotalPaid >= payingItem.amount;

        await db.ledger.update(payingItem.id, {
            payments: updatedPayments,
            isPaid: isNowFullyPaid,
            paidAt: isNowFullyPaid ? Date.now() : undefined
        });

        addToast(t(language, 'paymentAdded'), 'success');
        handleClosePaymentModal();
    };

    // Delete single payment from history (and remove linked transaction)
    const handleDeletePayment = async (item: LedgerItem, paymentId: string) => {
        if (!confirm(t(language, 'deletePaymentConfirm'))) return;
        if (!item.id || !item.payments) return;

        const paymentToDelete = item.payments.find(p => p.id === paymentId);
        if (paymentToDelete && paymentToDelete.transactionId) {
            try {
                await db.transactions.delete(paymentToDelete.transactionId);
            } catch (err) {
                console.warn('Could not delete payment transaction:', err);
            }
        }

        const updatedPayments = item.payments.filter(p => p.id !== paymentId);
        const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const isNowPaid = newTotalPaid >= item.amount;

        await db.ledger.update(item.id, {
            payments: updatedPayments,
            isPaid: isNowPaid,
            paidAt: isNowPaid ? item.paidAt || Date.now() : undefined
        });

        addToast(t(language, 'paymentDeleted'), 'info');
    };

    // Delete entire ledger item (and cascade delete linked transactions)
    const handleDelete = async (item: LedgerItem) => {
        if (!confirm(t(language, 'deleteTransactionConfirm'))) return;
        if (!item.id) return;

        // Clean up initial transaction
        if (item.initialTransactionId) {
            try {
                await db.transactions.delete(item.initialTransactionId);
            } catch (err) {
                console.warn('Could not delete initial transaction:', err);
            }
        }

        // Clean up payment transactions
        if (item.payments && item.payments.length > 0) {
            for (const p of item.payments) {
                if (p.transactionId) {
                    try {
                        await db.transactions.delete(p.transactionId);
                    } catch (err) {
                        console.warn('Could not delete payment transaction:', err);
                    }
                }
            }
        }

        await db.ledger.delete(item.id);
        addToast(t(language, 'delete') + ' ✓', 'info');
    };

    // Quick full-toggle paid button on card
    const handleQuickTogglePaid = async (item: LedgerItem) => {
        if (!item.id) return;
        const status = getLedgerStatus(item);

        if (status === 'paid') {
            // Reopen: set isPaid = false
            await db.ledger.update(item.id, {
                isPaid: false,
                paidAt: undefined
            });
            addToast(t(language, 'markAsUnpaid'), 'info');
        } else {
            // Open payment modal with remaining amount prefilled
            handleOpenPaymentModal(item);
        }
    };

    // Filter and sort items
    const filteredItems = useMemo(() => {
        if (!ledgerItems) return [];
        let items = ledgerItems.filter(i => i.type === activeTab);

        if (statusFilter === 'active') {
            items = items.filter(i => getLedgerStatus(i) !== 'paid');
        } else if (statusFilter === 'settled') {
            items = items.filter(i => getLedgerStatus(i) === 'paid');
        }

        return items;
    }, [ledgerItems, activeTab, statusFilter]);

    // KPI Metrics calculation
    const metrics = useMemo(() => {
        if (!ledgerItems) {
            return {
                remainingReceivable: 0,
                totalReceivable: 0,
                collectedReceivable: 0,
                remainingPayable: 0,
                totalPayable: 0,
                settledPayable: 0
            };
        }

        const receivables = ledgerItems.filter(i => i.type === 'receivable');
        const payables = ledgerItems.filter(i => i.type === 'payable');

        const remainingReceivable = receivables.reduce((s, i) => s + getLedgerRemainingAmount(i), 0);
        const totalReceivable = receivables.reduce((s, i) => s + i.amount, 0);
        const collectedReceivable = receivables.reduce((s, i) => s + getLedgerPaidAmount(i), 0);

        const remainingPayable = payables.reduce((s, i) => s + getLedgerRemainingAmount(i), 0);
        const totalPayable = payables.reduce((s, i) => s + i.amount, 0);
        const settledPayable = payables.reduce((s, i) => s + getLedgerPaidAmount(i), 0);

        return {
            remainingReceivable,
            totalReceivable,
            collectedReceivable,
            remainingPayable,
            totalPayable,
            settledPayable
        };
    }, [ledgerItems]);

    if (!ledgerItems) {
        return (
            <div className="ledger-view">
                <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />
            </div>
        );
    }

    return (
        <div className="ledger-view">
            {/* Top KPI Summary Cards */}
            <div className="ledger-summary">
                <div
                    className={`summary-card receivable ${activeTab === 'receivable' ? 'active-summary' : ''}`}
                    onClick={() => setActiveTab('receivable')}
                >
                    <div className="summary-header">
                        <span className="label"><ArrowDownLeft size={15} /> {t(language, 'toReceive')}</span>
                        <span className="sub-badge">{t(language, 'remaining')}</span>
                    </div>
                    <span className="amount">{formatCurrency(metrics.remainingReceivable)}</span>
                    <div className="summary-footer">
                        <span>{t(language, 'paidSoFar')}: {formatCurrency(metrics.collectedReceivable)}</span>
                    </div>
                </div>

                <div
                    className={`summary-card payable ${activeTab === 'payable' ? 'active-summary' : ''}`}
                    onClick={() => setActiveTab('payable')}
                >
                    <div className="summary-header">
                        <span className="label"><ArrowUpRight size={15} /> {t(language, 'toPay')}</span>
                        <span className="sub-badge">{t(language, 'remaining')}</span>
                    </div>
                    <span className="amount">{formatCurrency(metrics.remainingPayable)}</span>
                    <div className="summary-footer">
                        <span>{t(language, 'paidSoFar')}: {formatCurrency(metrics.settledPayable)}</span>
                    </div>
                </div>
            </div>

            {/* Type Switcher Tabs */}
            <div className="ledger-tabs">
                <button
                    className={activeTab === 'receivable' ? 'active' : ''}
                    onClick={() => setActiveTab('receivable')}
                >
                    <ArrowDownLeft size={16} />
                    <span>{t(language, 'receivables')}</span>
                </button>
                <button
                    className={activeTab === 'payable' ? 'active' : ''}
                    onClick={() => setActiveTab('payable')}
                >
                    <ArrowUpRight size={16} />
                    <span>{t(language, 'payables')}</span>
                </button>
            </div>

            {/* Sub-Filter Pills & Add Button Bar */}
            <div className="ledger-control-bar">
                <div className="ledger-filter-pills">
                    <button
                        className={statusFilter === 'active' ? 'active' : ''}
                        onClick={() => setStatusFilter('active')}
                    >
                        {t(language, 'activeLedger')}
                    </button>
                    <button
                        className={statusFilter === 'all' ? 'active' : ''}
                        onClick={() => setStatusFilter('all')}
                    >
                        {t(language, 'allLedger')}
                    </button>
                    <button
                        className={statusFilter === 'settled' ? 'active' : ''}
                        onClick={() => setStatusFilter('settled')}
                    >
                        {t(language, 'settledLedger')}
                    </button>
                </div>

                <button className="ledger-add-btn" onClick={handleOpenAddForm}>
                    <Plus size={16} />
                    <span>{activeTab === 'receivable' ? t(language, 'addReceivable') : t(language, 'addPayable')}</span>
                </button>
            </div>

            {/* Ledger Items List */}
            <div className="ledger-list">
                {filteredItems.length === 0 ? (
                    <div className="ledger-empty-state">
                        <BookOpen size={40} className="empty-icon" />
                        <p className="empty-message">
                            {statusFilter === 'settled'
                                ? (language === 'id' ? 'Belum ada catatan yang lunas.' : 'No settled records yet.')
                                : (activeTab === 'receivable'
                                    ? (language === 'id' ? 'Belum ada piutang aktif.' : 'No active receivables.')
                                    : (language === 'id' ? 'Belum ada hutang aktif.' : 'No active payables.'))}
                        </p>
                        <button className="empty-cta-btn" onClick={handleOpenAddForm}>
                            <Plus size={16} /> {activeTab === 'receivable' ? t(language, 'addReceivable') : t(language, 'addPayable')}
                        </button>
                    </div>
                ) : (
                    filteredItems.map(item => {
                        const paid = getLedgerPaidAmount(item);
                        const remaining = getLedgerRemainingAmount(item);
                        const progress = getLedgerProgressPercent(item);
                        const status = getLedgerStatus(item);
                        const account = getAccount(item.accountId);
                        const isExpanded = expandedHistoryId === item.id;
                        const paymentsCount = item.payments?.length || 0;

                        return (
                            <div
                                key={item.id}
                                className={`ledger-card ${status === 'paid' ? 'is-paid' : ''} ${status === 'partial' ? 'is-partial' : ''}`}
                            >
                                {/* Card Header */}
                                <div className="ledger-card-header">
                                    <div className="person-block">
                                        <div
                                            className={`status-indicator-dot ${status}`}
                                            title={status}
                                        />
                                        <span className="person-name">{item.personName}</span>
                                    </div>

                                    <div className="status-badge-wrapper">
                                        {status === 'paid' && (
                                            <span className="ledger-badge paid">
                                                <CheckCircle2 size={12} /> {t(language, 'paid')}
                                            </span>
                                        )}
                                        {status === 'partial' && (
                                            <span className="ledger-badge partial">
                                                <Clock size={12} /> {t(language, 'partialPaid')} ({progress}%)
                                            </span>
                                        )}
                                        {status === 'unpaid' && (
                                            <span className="ledger-badge unpaid">
                                                <AlertCircle size={12} /> {t(language, 'unpaid')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Meta Info (Notes, Due Date, Linked Account) */}
                                <div className="ledger-card-meta">
                                    {item.note && (
                                        <span className="meta-note">{item.note}</span>
                                    )}
                                    <div className="meta-chips">
                                        {item.dueDate && (
                                            <span className="meta-chip due">
                                                <Calendar size={12} /> {t(language, 'deadline')}: {item.dueDate}
                                            </span>
                                        )}
                                        {account && (
                                            <span className="meta-chip account">
                                                <Wallet size={12} /> {account.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Amounts Display */}
                                <div className="ledger-amounts-row">
                                    <div className="amount-col primary">
                                        <span className="amount-caption">
                                            {status === 'paid' ? t(language, 'paidSoFar') : t(language, 'remaining')}
                                        </span>
                                        <span className={`amount-value ${activeTab === 'receivable' ? 'income-color' : 'expense-color'}`}>
                                            {status === 'paid' ? formatCurrency(item.amount) : formatCurrency(remaining)}
                                        </span>
                                    </div>

                                    <div className="amount-col secondary">
                                        <span className="amount-caption">{language === 'id' ? 'Total Pokok' : 'Total Principal'}</span>
                                        <span className="amount-subvalue">{formatCurrency(item.amount)}</span>
                                    </div>

                                    {paid > 0 && status !== 'paid' && (
                                        <div className="amount-col secondary">
                                            <span className="amount-caption">{t(language, 'paidSoFar')}</span>
                                            <span className="amount-subvalue paid-sub">{formatCurrency(paid)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="ledger-progress-container">
                                    <div className="ledger-progress-bar">
                                        <div
                                            className={`ledger-progress-fill ${status}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="progress-text">{progress}%</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="ledger-actions-row">
                                    <div className="left-actions">
                                        {status !== 'paid' && (
                                            <button
                                                className="record-payment-btn"
                                                onClick={() => handleOpenPaymentModal(item)}
                                            >
                                                <CreditCard size={14} />
                                                <span>{t(language, 'recordPayment')}</span>
                                            </button>
                                        )}

                                        <button
                                            className={`history-toggle-btn ${isExpanded ? 'expanded' : ''}`}
                                            onClick={() => setExpandedHistoryId(isExpanded ? null : item.id!)}
                                            title={t(language, 'paymentHistory')}
                                        >
                                            <History size={14} />
                                            <span>{paymentsCount > 0 ? `(${paymentsCount})` : ''}</span>
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>

                                    <div className="right-actions">
                                        <button
                                            className="quick-toggle-btn"
                                            onClick={() => handleQuickTogglePaid(item)}
                                            title={status === 'paid' ? t(language, 'markAsUnpaid') : t(language, 'payFull')}
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            className="edit-btn"
                                            onClick={() => handleEdit(item)}
                                            title={t(language, 'edit')}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(item)}
                                            title={t(language, 'delete')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expandable Payment History Section */}
                                {isExpanded && (
                                    <div className="ledger-history-section">
                                        <div className="history-header">
                                            <History size={14} />
                                            <h4>{t(language, 'paymentHistory')}</h4>
                                        </div>

                                        {(!item.payments || item.payments.length === 0) ? (
                                            <div className="history-empty">
                                                <p>{t(language, 'noPaymentsYet')}</p>
                                                {status !== 'paid' && (
                                                    <button
                                                        className="history-add-payment-btn"
                                                        onClick={() => handleOpenPaymentModal(item)}
                                                    >
                                                        <Plus size={12} /> {t(language, 'recordPayment')}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="history-payments-list">
                                                {item.payments.map((p, idx) => {
                                                    const pAcc = getAccount(p.accountId);
                                                    return (
                                                        <div key={p.id || idx} className="payment-history-item">
                                                            <div className="payment-main-info">
                                                                <div className="payment-header-row">
                                                                    <span className="payment-amount">{formatCurrency(p.amount)}</span>
                                                                    <span className="payment-date">{p.date}</span>
                                                                </div>
                                                                <div className="payment-sub-row">
                                                                    {pAcc && (
                                                                        <span className="payment-acc-badge">
                                                                            <Wallet size={11} /> {pAcc.name}
                                                                        </span>
                                                                    )}
                                                                    {p.note && (
                                                                        <span className="payment-note">{p.note}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="payment-delete-btn"
                                                                onClick={() => handleDeletePayment(item, p.id)}
                                                                title={t(language, 'delete')}
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* ========================================================================= */}
            {/* ADD / EDIT MODAL */}
            {/* ========================================================================= */}
            {showForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content compact ledger-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <BookOpen size={18} />
                                {editingId
                                    ? (activeTab === 'receivable' ? (language === 'id' ? 'Edit Piutang' : 'Edit Receivable') : (language === 'id' ? 'Edit Hutang' : 'Edit Payable'))
                                    : (activeTab === 'receivable' ? t(language, 'addReceivable') : t(language, 'addPayable'))}
                            </h3>
                            <button onClick={resetForm}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="ledger-form">
                            <div className="form-group">
                                <label>{language === 'id' ? 'Nama Orang / Pihak' : 'Person or Company Name'}</label>
                                <input
                                    type="text"
                                    placeholder={t(language, 'personOrCompany')}
                                    value={personName}
                                    onChange={e => setPersonName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>{t(language, 'amount')}</label>
                                <div className="amount-input-wrapper">
                                    <span className="currency-prefix">Rp</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={amount}
                                        onChange={e => {
                                            const digits = e.target.value.replace(/\D/g, '');
                                            setAmount(digits ? formatNumber(digits) : '');
                                        }}
                                        className="amount-input"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Account Selector */}
                            <div className="form-group">
                                <label>{t(language, 'sourceAccount')}</label>
                                <select
                                    value={accountId}
                                    onChange={e => setAccountId(e.target.value)}
                                >
                                    <option value="">{language === 'id' ? '-- Tanpa Akun Khusus --' : '-- No Linked Account --'}</option>
                                    {accounts?.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Option to record initial transaction */}
                            {!editingId && accountId && (
                                <div className="ledger-checkbox-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={recordTransaction}
                                            onChange={e => setRecordTransaction(e.target.checked)}
                                        />
                                        <span>
                                            {activeTab === 'receivable'
                                                ? t(language, 'disburseFromAccount')
                                                : t(language, 'receiveIntoAccount')}
                                        </span>
                                    </label>
                                </div>
                            )}

                            <div className="form-row two-col">
                                <div className="form-group">
                                    <label>{t(language, 'deadline')}</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t(language, 'noteOptional')}</label>
                                    <input
                                        type="text"
                                        placeholder={t(language, 'ledgerNote')}
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={resetForm} className="cancel-btn">
                                    {t(language, 'cancel')}
                                </button>
                                <button type="submit" className="submit-btn">
                                    <Check size={16} />
                                    {editingId ? t(language, 'updateTransaction') : t(language, 'save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* PARTIAL / FULL PAYMENT MODAL */}
            {/* ========================================================================= */}
            {payingItem && (
                <div className="modal-overlay" onClick={handleClosePaymentModal}>
                    <div className="modal-content compact ledger-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <CreditCard size={18} />
                                {t(language, 'recordPayment')} — {payingItem.personName}
                            </h3>
                            <button onClick={handleClosePaymentModal}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="ledger-form">
                            {/* Summary Banner inside modal */}
                            <div className="modal-debt-summary">
                                <div className="summary-stat">
                                    <span className="stat-label">{language === 'id' ? 'Total Pokok' : 'Total Debt'}</span>
                                    <span className="stat-val">{formatCurrency(payingItem.amount)}</span>
                                </div>
                                <div className="summary-stat">
                                    <span className="stat-label">{t(language, 'paidSoFar')}</span>
                                    <span className="stat-val positive">{formatCurrency(getLedgerPaidAmount(payingItem))}</span>
                                </div>
                                <div className="summary-stat">
                                    <span className="stat-label">{t(language, 'remaining')}</span>
                                    <span className="stat-val highlight">{formatCurrency(getLedgerRemainingAmount(payingItem))}</span>
                                </div>
                            </div>

                            {/* Payment Amount Input */}
                            <div className="form-group">
                                <label>{t(language, 'paymentAmount')}</label>
                                <div className="amount-input-wrapper">
                                    <span className="currency-prefix">Rp</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={paymentAmount}
                                        onChange={e => {
                                            const digits = e.target.value.replace(/\D/g, '');
                                            setPaymentAmount(digits ? formatNumber(digits) : '');
                                        }}
                                        className="amount-input"
                                        autoFocus
                                        required
                                    />
                                </div>

                                {/* Preset Percentage Pills */}
                                <div className="quick-amount-pills">
                                    <button type="button" onClick={() => setPresetAmount(1)}>
                                        {t(language, 'payFull')}
                                    </button>
                                    <button type="button" onClick={() => setPresetAmount(0.5)}>
                                        50%
                                    </button>
                                    <button type="button" onClick={() => setPresetAmount(0.25)}>
                                        25%
                                    </button>
                                </div>
                            </div>

                            {/* Account Selector */}
                            <div className="form-group">
                                <label>{t(language, 'sourceAccount')}</label>
                                <select
                                    value={paymentAccountId}
                                    onChange={e => setPaymentAccountId(e.target.value)}
                                    required={recordPaymentTransaction}
                                >
                                    <option value="">{language === 'id' ? '-- Pilih Akun Pembayaran --' : '-- Select Payment Account --'}</option>
                                    {accounts?.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Option to create real transaction */}
                            <div className="ledger-checkbox-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={recordPaymentTransaction}
                                        onChange={e => setRecordPaymentTransaction(e.target.checked)}
                                    />
                                    <span>{t(language, 'recordInTransactions')}</span>
                                </label>
                            </div>

                            <div className="form-row two-col">
                                <div className="form-group">
                                    <label>{t(language, 'date')}</label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={e => setPaymentDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t(language, 'noteOptional')}</label>
                                    <input
                                        type="text"
                                        placeholder={language === 'id' ? 'mis. Cicilan 1' : 'e.g., Installment 1'}
                                        value={paymentNote}
                                        onChange={e => setPaymentNote(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={handleClosePaymentModal} className="cancel-btn">
                                    {t(language, 'cancel')}
                                </button>
                                <button type="submit" className="submit-btn primary">
                                    <Check size={16} />
                                    {t(language, 'recordPayment')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
