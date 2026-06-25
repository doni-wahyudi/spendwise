import { useState, useEffect } from 'react';
import { formatNumber, parseFormattedNumber } from '../utils/currency';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';

interface ExchangeRates {
    [key: string]: number;
}

const CURRENCIES = [
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' }
];

// Approximate rates (IDR base) - in production, use an API
const DEFAULT_RATES: ExchangeRates = {
    IDR: 1,
    USD: 0.000063,
    EUR: 0.000058,
    GBP: 0.000050,
    JPY: 0.0094,
    SGD: 0.000085,
    MYR: 0.00030,
    AUD: 0.000097,
    CNY: 0.00046,
    KRW: 0.082
};

export default function CurrencyConverter() {
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('IDR');
    const [toCurrency, setToCurrency] = useState('USD');
    const [result, setResult] = useState<number | null>(null);
    const [rates] = useState<ExchangeRates>(DEFAULT_RATES);
    const [lastUpdated] = useState(new Date().toLocaleDateString());

    useEffect(() => {
        if (amount) {
            const value = parseFormattedNumber(amount);
            // Convert from source to IDR, then to target
            const inIDR = value / rates[fromCurrency];
            const converted = inIDR * rates[toCurrency];
            setResult(converted);
        } else {
            setResult(null);
        }
    }, [amount, fromCurrency, toCurrency, rates]);

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    const formatResult = (value: number, currency: string) => {
        const curr = CURRENCIES.find(c => c.code === currency);
        if (currency === 'IDR' || currency === 'KRW' || currency === 'JPY') {
            return `${curr?.symbol || ''}${Math.round(value).toLocaleString()}`;
        }
        return `${curr?.symbol || ''}${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    return (
        <section className="settings-section currency-converter">
            <div className="section-header">
                <h3><ArrowRightLeft size={18} /> Currency Converter</h3>
            </div>

            <div className="converter-form">
                <div className="converter-row">
                    <div className="input-group">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(formatNumber(e.target.value.replace(/\D/g, '')))}
                        />
                        <select
                            value={fromCurrency}
                            onChange={(e) => setFromCurrency(e.target.value)}
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={handleSwap} className="swap-btn" title="Swap currencies">
                        <ArrowRightLeft size={16} />
                    </button>

                    <div className="input-group">
                        <select
                            value={toCurrency}
                            onChange={(e) => setToCurrency(e.target.value)}
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {result !== null && (
                    <div className="converter-result">
                        <span className="from-amount">
                            {formatResult(parseFormattedNumber(amount), fromCurrency)}
                        </span>
                        <span className="equals">=</span>
                        <span className="to-amount">
                            {formatResult(result, toCurrency)}
                        </span>
                    </div>
                )}

                <div className="converter-info">
                    <RefreshCw size={12} />
                    <span>Rates as of {lastUpdated} (approximate)</span>
                </div>
            </div>
        </section>
    );
}
