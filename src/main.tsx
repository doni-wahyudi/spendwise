import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { seedDatabase } from './db/seed'
import { seedAccounts } from './db/seedAccounts'
import { processRecurringTransactions } from './db/recurring'
import { AuthProvider } from './store/AuthContext'
import './db/sync'

// Initialize DB seeding
seedDatabase();
seedAccounts();

// Process any due recurring transactions
processRecurringTransactions().then(count => {
    if (count > 0) {
        console.log(`Generated ${count} recurring transaction(s)`);
    }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>,
)

// Register Service Worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        const swUrl = `${import.meta.env.BASE_URL}sw.js`;
        navigator.serviceWorker.register(swUrl)
            .then((reg) => {
                console.log('ServiceWorker registration successful with scope: ', reg.scope);
            })
            .catch((err) => {
                console.error('ServiceWorker registration failed: ', err);
            });
    });
}
