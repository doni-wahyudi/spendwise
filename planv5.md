# Plan v5 — Comprehensive Monthly & Custom Range Reports with Category Item Drilldown

## Goal
Provide a comprehensive, dedicated Financial Statement and Reports system in SpendWise. Allows users to analyze their financial performance across monthly, salary cycle, custom date range, and yearly periods, with executive summary KPIs, daily cash flow distribution, and hierarchical category accordions with deep drilldowns into repeated item groups and individual transaction records.

## Proposed & Completed Changes

### 1. New Component: `src/components/ReportsView.tsx`
- **[NEW] `src/components/ReportsView.tsx`**:
  1. **Period Engine**: Monthly navigation stepper (`< Month Year >`), Salary cycle period (respecting `salaryDay`), Custom Range picker with instant presets (*This Month*, *Last Month*, *Last 30 Days*), and Yearly view.
  2. **Executive Summary**: Total Inflow, Total Outflow, Net Cash Flow, Savings Rate (%), Daily Average Spend, Peak Spending Day, and comparative delta against prior periods.
  3. **Visual Flow & Distribution**: Proportional Cashflow Allocation bar (Spent vs Saved) and Daily Outflow Bar Chart using Chart.js.
  4. **Deep Category Drilldown**:
     - Mode toggle for **Expense Breakdown** and **Income Breakdown**.
     - Search box within report to filter categories and item descriptions.
     - Sort by Highest Spend, Item Count, or Name.
     - Interactive Accordion with category dot, total sum, % share, transaction count, average per transaction, and budget status badge.
     - Two drilldown sub-tabs:
       - **Top / Frequent Items**: Aggregates identical notes/descriptions (frequency count, total spent, and % share of category).
       - **All Transactions**: Chronological transaction list showing date, note, account badge, tags, amount, and edit action.
     - Tag distribution summary within category.
  5. **Export & Sharing Suite**: Export to CSV with summary headers, copy formatted WhatsApp/Markdown summary to clipboard with toast notification, and print/PDF support.

### 2. Tab Navigation & Routing
- **[MODIFY] `src/store/useStore.ts`**: Added `'reports'` to the `activeTab` union type.
- **[MODIFY] `src/App.tsx`**:
  - Integrated `ReportsView` into tab rendering.
  - Added a dedicated `Reports` navigation button to the bottom navigation bar.
  - Added an interactive "View Full Financial Report" quick banner on the Dashboard.
- **[MODIFY] `src/components/Reports.tsx`**: Added a quick "Full Report" CTA button in Settings pointing directly to `ReportsView`.

### 3. Internationalization (i18n)
- **[MODIFY] `src/i18n/translations.ts`**: Added complete bilingual dictionary entries (Indonesian & English) for report metrics, period selectors, breakdown tabs, tooltips, and copy/export messages.

### 4. Styles & Design System
- **[MODIFY] `src/index.css`**: Added over 400 lines of modern, responsive CSS supporting both dark and light modes, micro-animations, glassmorphic cards, and `@media print` stylesheets for A4 financial report generation.

## Verification & Results
- Ran `npm run build` locally: compiled successfully with zero TypeScript or bundling errors.
- Verified period steppers, KPI calculations, item aggregations, accordion transitions, CSV export generator, and copy-to-clipboard formatting.

## Completion Log
- **What was done**: Designed, built, and integrated `ReportsView.tsx` with monthly/custom range period filtering, executive summary KPIs, daily outflow chart, hierarchical category drilldown with repeated item grouping and individual transaction records, income breakdown, CSV/Clipboard export, and full bilingual support.
- **Why it was done**: To satisfy user request for comprehensive monthly and custom range reports with deep category and itemized breakdowns.
- **What changed**: Added `src/components/ReportsView.tsx`, `planv5.md`; modified `src/App.tsx`, `src/store/useStore.ts`, `src/i18n/translations.ts`, `src/components/Reports.tsx`, and `src/index.css`.
- **Unresolved items**: None.
