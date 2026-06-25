---
description: Component patterns and best practices from SpendWise project
---

# Component Patterns & Best Practices

## 1. Settings Section Pattern

Reusable section wrapper for settings items:

```tsx
<section className="settings-section">
    <div className="section-header">
        <h3><Icon size={18} /> Section Title</h3>
    </div>
    {/* Section content */}
</section>
```

## 2. Form Pattern

Standard form with controlled inputs:

```tsx
const [name, setName] = useState('');
const [amount, setAmount] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) {
        addToast('Please fill all fields', 'error');
        return;
    }
    
    await db.items.add({ name, amount: parseFloat(amount) });
    addToast('Created successfully!', 'success');
    setName('');
    setAmount('');
};

return (
    <form onSubmit={handleSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <input 
            type="text" 
            inputMode="numeric"
            value={amount} 
            onChange={(e) => setAmount(formatNumber(e.target.value))} 
        />
        <button type="submit">Save</button>
    </form>
);
```

## 3. List with CRUD Operations

```tsx
const items = useLiveQuery(() => db.items.toArray());

const handleDelete = async (id: number) => {
    if (confirm('Delete this item?')) {
        await db.items.delete(id);
        addToast('Deleted', 'info');
    }
};

if (!items) return <div className="skeleton" />;

return (
    <div className="item-list">
        {items.length === 0 ? (
            <p className="empty-message">No items yet</p>
        ) : (
            items.map(item => (
                <div key={item.id} className="item-row">
                    <span>{item.name}</span>
                    <button onClick={() => handleDelete(item.id)}>
                        <Trash2 size={14} />
                    </button>
                </div>
            ))
        )}
    </div>
);
```

## 4. Toggle Switch Pattern

```tsx
const [enabled, setEnabled] = useState(false);

return (
    <button 
        onClick={() => setEnabled(!enabled)}
        className={`toggle-switch ${enabled ? 'active' : ''}`}
    >
        <span className="toggle-knob" />
    </button>
);
```

CSS:
```css
.toggle-switch {
    width: 48px;
    height: 26px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 13px;
    border: none;
    cursor: pointer;
    position: relative;
}

.toggle-switch.active {
    background: var(--primary);
}

.toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
}

.toggle-switch.active .toggle-knob {
    transform: translateX(22px);
}
```

## 5. Chart Component Pattern

```tsx
import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';

const chartData = useMemo(() => {
    if (!data) return null;
    
    return {
        labels: data.map(d => d.name),
        datasets: [{
            data: data.map(d => d.value),
            backgroundColor: data.map(d => d.color),
        }]
    };
}, [data]);

if (!chartData) return <div className="skeleton" />;

return (
    <div className="chart-container">
        <Doughnut data={chartData} />
    </div>
);
```

## 6. Date Filter Pattern

```tsx
const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    
    switch (period) {
        case 'week':
            start = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            break;
    }
    
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    };
}, [period]);
```

## 7. Modal Pattern

```tsx
const [isOpen, setIsOpen] = useState(false);

if (!isOpen) return null;

return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Modal Title</h3>
            {/* Content */}
            <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
    </div>
);
```

## 8. Loading States

Always handle loading:

```tsx
const items = useLiveQuery(() => db.items.toArray());

if (!items) {
    return <div className="skeleton" style={{ height: 100 }} />;
}

if (items.length === 0) {
    return <p className="empty-message">No data</p>;
}

return <div>{/* Render items */}</div>;
```

## 9. Toast Notifications

```tsx
// store/useToast.ts
import { create } from 'zustand';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastState {
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type']) => void;
    removeToast: (id: number) => void;
}

export const useToast = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message, type = 'info') => {
        const id = Date.now();
        set((state) => ({ 
            toasts: [...state.toasts, { id, message, type }] 
        }));
        setTimeout(() => {
            set((state) => ({ 
                toasts: state.toasts.filter(t => t.id !== id) 
            }));
        }, 3000);
    },
    removeToast: (id) => set((state) => ({ 
        toasts: state.toasts.filter(t => t.id !== id) 
    }))
}));
```

## 10. Currency Formatting

```typescript
// utils/currency.ts
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

export function formatNumber(value: string): string {
    const num = value.replace(/\D/g, '');
    return parseInt(num || '0').toLocaleString();
}

export function parseFormattedNumber(value: string): number {
    return parseInt(value.replace(/\D/g, '') || '0');
}
```
