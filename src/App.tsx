import { useStore } from './store/useStore';
import { useState, useEffect, useRef } from 'react';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import SummaryChart from './components/SummaryChart';
import SummaryCards from './components/SummaryCards';
import BudgetProgress from './components/BudgetProgress';
import SettingsView from './components/SettingsView';
import DateFilter from './components/DateFilter';
import SearchFilter from './components/SearchFilter';
import TrendChart from './components/TrendChart';
import Toast from './components/Toast';
import RecordsView from './components/RecordsView';
import SpendingInsights from './components/SpendingInsights';
import Onboarding from './components/Onboarding';
import CategoryComparison from './components/CategoryComparison';
import BudgetForecast from './components/BudgetForecast';
import HeatMapCalendar from './components/HeatMapCalendar';
import AccountsView from './components/AccountsView';
import TagComparison from './components/TagComparison';
import LedgerView from './components/LedgerView';
import ExpensePieChart from './components/ExpensePieChart';
import { useBudgetAlerts } from './hooks/useBudgetAlerts';
import { processRecurringTransactions } from './db/recurring';
import { useToast } from './store/useToast';
import { CreditCard, PieChart, Settings, Plus, Calendar, X, BookOpen } from 'lucide-react';

function App() {
    const { activeTab, setActiveTab, theme, editingTransaction, setEditingTransaction } = useStore();
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const { addToast } = useToast();
    const recurringProcessed = useRef(false);

    // Budget alerts - monitors spending and shows warnings
    useBudgetAlerts();

    // Process recurring transactions on app load (once per session)
    useEffect(() => {
        if (!recurringProcessed.current) {
            recurringProcessed.current = true;
            processRecurringTransactions().then(count => {
                if (count > 0) {
                    addToast(`Generated ${count} recurring transaction${count > 1 ? 's' : ''}`, 'info');
                }
            });
        }
    }, [addToast]);

    // Apply theme to body
    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    // Handle Android back button - close modals before exiting
    useEffect(() => {
        let backButtonListener: { remove: () => void } | null = null;

        const setupBackButton = async () => {
            try {
                const { App } = await import('@capacitor/app');
                backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
                    // Check if any modal is open
                    if (showSettings || showTransactionModal || editingTransaction) {
                        // Close modals in priority order
                        if (showTransactionModal || editingTransaction) {
                            setShowTransactionModal(false);
                            setEditingTransaction(null);
                        } else if (showSettings) {
                            setShowSettings(false);
                        }
                    } else if (canGoBack) {
                        window.history.back();
                    } else {
                        // At root, minimize app instead of exit
                        App.minimizeApp();
                    }
                });
            } catch {
                // Fallback for web - use popstate
                const handlePopState = () => {
                    if (showSettings || showTransactionModal || editingTransaction) {
                        if (showTransactionModal || editingTransaction) {
                            setShowTransactionModal(false);
                            setEditingTransaction(null);
                        } else if (showSettings) {
                            setShowSettings(false);
                        }
                        window.history.pushState(null, '', window.location.href);
                    }
                };
                window.history.pushState(null, '', window.location.href);
                window.addEventListener('popstate', handlePopState);
            }
        };

        setupBackButton();

        return () => {
            backButtonListener?.remove();
        };
    }, [showSettings, showTransactionModal, editingTransaction, setEditingTransaction]);

    // Show modal when editing a transaction
    useEffect(() => {
        if (editingTransaction) {
            setShowTransactionModal(true);
        }
    }, [editingTransaction]);

    // Clear editing state when modal closes
    const handleCloseModal = () => {
        setShowTransactionModal(false);
        setEditingTransaction(null);
    };

    return (
        <div className="app-container">
            <Onboarding />
            <Toast />
            <header className="app-header">
                <h1>SpendWise</h1>
                <button
                    className="header-settings-btn"
                    onClick={() => setShowSettings(true)}
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
            </header>

            <main className="app-content">
                {activeTab === 'dashboard' && (
                    <div className="dashboard-view">
                        <DateFilter />
                        <SummaryCards />
                        {/* 1. Insights */}
                        <SpendingInsights />
                        {/* 2. Expense Pie Chart */}
                        <ExpensePieChart />
                        {/* 3. Recent Transactions */}
                        <div className="dashboard-transactions-section">
                            <h3>Recent Transactions</h3>
                            <SearchFilter />
                            <div className="scrollable-transactions">
                                <TransactionList limit={5} useFilter={true} useSearch={true} />
                            </div>
                        </div>
                        {/* 4. Spending Breakdown */}
                        <SummaryChart />
                        {/* 4. Category Comparison */}
                        <CategoryComparison />
                        {/* 5. Tag Comparison */}
                        <TagComparison />
                        {/* 6. Spending Heatmap */}
                        <HeatMapCalendar />
                        {/* 7. Budget Forecast */}
                        <BudgetForecast />
                        {/* 8. Budget Progress */}
                        <BudgetProgress />
                        {/* 9. Balance Trend (Income vs Expense) */}
                        <TrendChart />
                    </div>
                )}

                {activeTab === 'accounts' && (
                    <AccountsView />
                )}

                {activeTab === 'records' && (
                    <RecordsView />
                )}

                {activeTab === 'ledger' && (
                    <LedgerView />
                )}
            </main>

            {/* Floating Action Button */}
            <button
                className="fab"
                onClick={() => setShowTransactionModal(true)}
                title="Add Transaction"
            >
                <Plus size={24} />
            </button>

            {/* Transaction Modal */}
            {showTransactionModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content transaction-modal compact" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
                            <button onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <TransactionForm onSuccess={handleCloseModal} />
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="modal-overlay settings-modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Settings size={18} /> Settings</h3>
                            <button onClick={() => setShowSettings(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <SettingsView />
                    </div>
                </div>
            )}

            <nav className="bottom-nav">
                <button
                    className={activeTab === 'dashboard' ? 'active' : ''}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <PieChart size={20} />
                    <span>Dashboard</span>
                </button>
                <button
                    className={activeTab === 'accounts' ? 'active' : ''}
                    onClick={() => setActiveTab('accounts')}
                >
                    <CreditCard size={20} />
                    <span>Accounts</span>
                </button>
                <button
                    className={activeTab === 'records' ? 'active' : ''}
                    onClick={() => setActiveTab('records')}
                >
                    <Calendar size={20} />
                    <span>Records</span>
                </button>
                <button
                    className={activeTab === 'ledger' ? 'active' : ''}
                    onClick={() => setActiveTab('ledger')}
                >
                    <BookOpen size={20} />
                    <span>Ledger</span>
                </button>
            </nav>
        </div>
    );
}

export default App;
