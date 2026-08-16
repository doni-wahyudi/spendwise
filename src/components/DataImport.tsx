import { useState, useRef } from 'react';
import { db } from '../db/db';
import { formatLocalDate } from '../utils/dateUtils';
import { Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

export default function DataImport() {
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('loading');
        setMessage('');

        try {
            const text = await file.text();
            const ext = file.name.split('.').pop()?.toLowerCase();

            if (ext === 'json') {
                await importJSON(text);
            } else if (ext === 'csv') {
                await importCSV(text);
            } else {
                throw new Error('Unsupported file format. Use JSON or CSV.');
            }
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to import data');
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const importJSON = async (text: string) => {
        const data = JSON.parse(text);

        if (!data.transactions || !Array.isArray(data.transactions)) {
            throw new Error('Invalid JSON format. Expected "transactions" array.');
        }

        let txCount = 0;
        let catCount = 0;

        // Import categories first if present
        if (data.categories && Array.isArray(data.categories)) {
            for (const cat of data.categories) {
                const existing = await db.categories.where('name').equals(cat.name).first();
                if (!existing) {
                    await db.categories.add({
                        name: cat.name,
                        type: cat.type || 'expense',
                        color: cat.color || '#6366f1',
                        isDefault: false
                    });
                    catCount++;
                }
            }
        }

        // Import transactions
        for (const tx of data.transactions) {
            await db.transactions.add({
                type: tx.type || 'expense',
                amount: Number(tx.amount) || 0,
                categoryId: Number(tx.categoryId) || 1,
                date: tx.date || formatLocalDate(new Date()),
                note: tx.note || '',
                createdAt: tx.createdAt || Date.now()
            });
            txCount++;
        }

        setStatus('success');
        setMessage(`Imported ${txCount} transactions and ${catCount} categories`);
    };

    const importCSV = async (text: string) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV file is empty or missing header row');
        }

        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredFields = ['type', 'amount', 'date'];

        for (const field of requiredFields) {
            if (!header.includes(field)) {
                throw new Error(`CSV missing required column: ${field}`);
            }
        }

        let txCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: Record<string, string> = {};

            header.forEach((h, idx) => {
                row[h] = values[idx] || '';
            });

            // Find or create category
            let categoryId = 1;
            if (row.category) {
                const cat = await db.categories.where('name').equalsIgnoreCase(row.category).first();
                if (cat) {
                    categoryId = cat.id;
                }
            }

            await db.transactions.add({
                type: row.type === 'income' ? 'income' : 'expense',
                amount: Number(row.amount.replace(/[^0-9.-]/g, '')) || 0,
                categoryId,
                date: row.date || formatLocalDate(new Date()),
                note: row.note || '',
                createdAt: Date.now()
            });
            txCount++;
        }

        setStatus('success');
        setMessage(`Imported ${txCount} transactions from CSV`);
    };

    return (
        <section className="settings-section">
            <h3>
                <Upload size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Import Data
            </h3>
            <p className="settings-description">Import transactions from JSON or CSV files.</p>

            <div className="import-buttons">
                <label className="import-btn">
                    <FileJson size={16} />
                    Import JSON
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </label>
                <label className="import-btn">
                    <FileSpreadsheet size={16} />
                    Import CSV
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </label>
            </div>

            {status === 'loading' && (
                <div className="import-status loading">Processing...</div>
            )}

            {status === 'success' && (
                <div className="import-status success">
                    <CheckCircle size={16} />
                    {message}
                </div>
            )}

            {status === 'error' && (
                <div className="import-status error">
                    <AlertCircle size={16} />
                    {message}
                </div>
            )}

            <p className="settings-description" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                <strong>JSON format:</strong> {`{ "transactions": [...], "categories": [...] }`}<br />
                <strong>CSV format:</strong> type,amount,date,note,category
            </p>
        </section>
    );
}
