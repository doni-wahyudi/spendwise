// Date utilities for filtering transactions

export type FilterType = 'week' | 'month' | 'lastMonth' | '3months' | 'year' | 'all' | 'custom' | 'salary';

export interface DateRange {
    startDate: string;
    endDate: string;
    label: string;
}

/**
 * Get the salary period range based on salary day.
 * If salary day is 25th and today is Jan 10:
 * - Period: Dec 25 → Jan 24
 * If today is Jan 30:
 * - Period: Jan 25 → Feb 24
 */
export function getSalaryPeriodRange(salaryDay: number): DateRange {
    const now = new Date();
    const currentDay = now.getDate();

    let startDate: Date;
    let endDate: Date;

    if (currentDay >= salaryDay) {
        // Current period started this month
        startDate = new Date(now.getFullYear(), now.getMonth(), salaryDay);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, salaryDay - 1);
    } else {
        // Current period started last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, salaryDay);
        endDate = new Date(now.getFullYear(), now.getMonth(), salaryDay - 1);
    }

    // Format as YYYY-MM-DD using local time (avoid toISOString timezone issues)
    const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const formatLabel = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        label: `${formatLabel(startDate)} - ${formatLabel(endDate)}`
    };
}

export function getDateRange(filterType: FilterType, customStart?: string, customEnd?: string, salaryDay?: number): DateRange {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (filterType) {
        case 'week': {
            const dayOfWeek = now.getDay();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - dayOfWeek);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return {
                startDate: startOfWeek.toISOString().split('T')[0],
                endDate: endOfWeek.toISOString().split('T')[0],
                label: 'This Week'
            };
        }

        case 'month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
                startDate: startOfMonth.toISOString().split('T')[0],
                endDate: endOfMonth.toISOString().split('T')[0],
                label: 'This Month'
            };
        }

        case 'lastMonth': {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return {
                startDate: startOfLastMonth.toISOString().split('T')[0],
                endDate: endOfLastMonth.toISOString().split('T')[0],
                label: 'Last Month'
            };
        }

        case '3months': {
            const startOf3Months = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
                startDate: startOf3Months.toISOString().split('T')[0],
                endDate: endOfMonth.toISOString().split('T')[0],
                label: 'Last 3 Months'
            };
        }

        case 'year': {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31);
            return {
                startDate: startOfYear.toISOString().split('T')[0],
                endDate: endOfYear.toISOString().split('T')[0],
                label: 'This Year'
            };
        }

        case 'all': {
            return {
                startDate: '2000-01-01',
                endDate: '2100-12-31',
                label: 'All Time'
            };
        }

        case 'salary': {
            return getSalaryPeriodRange(salaryDay || 1);
        }

        case 'custom': {
            return {
                startDate: customStart || today,
                endDate: customEnd || today,
                label: 'Custom Range'
            };
        }

        default:
            return getDateRange('month');
    }
}

export function formatDateLabel(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}
