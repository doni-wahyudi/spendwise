---
description: CSS design system approach used in SpendWise
---

# CSS Design System Guide

## Approach: Single CSS File

All styles in `src/index.css` with:
- CSS custom properties (variables)
- Theme support via `[data-theme]`
- Organized sections with comments
- Mobile-first responsive design

## 1. CSS Variables

```css
:root {
    /* Colors */
    --primary: #6366f1;
    --success: #10b981;
    --danger: #ef4444;
    --warning: #f59e0b;
    
    /* Theme colors (dark mode default) */
    --bg-primary: #0f0f23;
    --bg-secondary: #1a1a2e;
    --card-bg: rgba(30, 30, 46, 0.95);
    --text-primary: #ffffff;
    --text-secondary: #a1a1aa;
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    
    /* Border radius */
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
}
```

## 2. Light Theme Override

```css
[data-theme="light"] {
    --bg-primary: #f8fafc;
    --bg-secondary: #f1f5f9;
    --card-bg: #ffffff;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
}

/* Component-specific light overrides */
body[data-theme="light"] .card {
    border: 1px solid #e2e8f0;
}
```

## 3. Section Organization

```css
/* =================================
   COMPONENT NAME
   ================================= */
.component-name {
    /* styles */
}

/* Light theme for Component */
body[data-theme="light"] .component-name {
    /* light overrides */
}
```

## 4. Common Patterns

### Cards
```css
.card {
    background: var(--card-bg);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
}
```

### Buttons
```css
.btn-primary {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-outline {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-secondary);
}
```

### Forms
```css
input, select {
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

input:focus, select:focus {
    outline: none;
    border-color: var(--primary);
}

body[data-theme="light"] input,
body[data-theme="light"] select {
    background: white;
    border-color: #e2e8f0;
}
```

### Grid Layouts
```css
.grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
}
```

### Flex Utilities
```css
.flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
}
```

## 5. Loading States

```css
.skeleton {
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 25%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.05) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: var(--radius-sm);
}

@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

## 6. Animations

```css
/* Spin for loaders */
.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Fade in */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in {
    animation: fadeIn 0.3s ease-out;
}
```

## 7. Mobile Navigation

```css
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--bg-secondary);
    display: flex;
    justify-content: space-around;
    padding: 0.5rem 0;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.7rem;
}

.nav-item.active {
    color: var(--primary);
}
```

## 8. Responsive Breakpoints

```css
/* Mobile first - base styles for mobile */

/* Tablet and up */
@media (min-width: 768px) {
    .container {
        max-width: 600px;
        margin: 0 auto;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .container {
        max-width: 800px;
    }
}
```

## 9. Status Colors

```css
.status-success { color: var(--success); }
.status-warning { color: var(--warning); }
.status-danger { color: var(--danger); }

.bg-success { background: rgba(16, 185, 129, 0.1); }
.bg-warning { background: rgba(245, 158, 11, 0.1); }
.bg-danger { background: rgba(239, 68, 68, 0.1); }
```

## 10. Theme Toggle Implementation

In App.tsx:
```typescript
useEffect(() => {
    document.body.setAttribute('data-theme', theme);
}, [theme]);
```

Toggle component:
```typescript
const { theme, setTheme } = useStore();

<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
    {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```
