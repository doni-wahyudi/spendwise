// Date utilities for filtering transactions

export type FilterType = 'week' | 'month' | 'lastMonth' | '3months' | 'year' | 'all' | 'custom' | 'salary';

export interface DateRange {
    startDate: string;
    endDate: string;
    label: string;
}

/**
 * Format a Date object as YYYY-MM-DD in local time (avoiding toISOString UTC timezone shifts)
 */
export function formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

    let startYear = now.getFullYear();
    let startMonth = now.getMonth();

    if (currentDay < salaryDay) {
        // Current period started last month
        startMonth -= 1;
        if (startMonth < 0) {
            startMonth = 11;
            startYear -= 1;
        }
    }

    // Clamp start day to max days in start month (e.g. Feb 28/29)
    const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
    const actualStartDay = Math.min(salaryDay, daysInStartMonth);
    const startDate = new Date(startYear, startMonth, actualStartDay);

    let endDate: Date;
    if (salaryDay === 1) {
        // Special case: full calendar month
        endDate = new Date(startYear, startMonth + 1, 0);
    } else {
        // Ends on salaryDay - 1 of next month
        let endYear = startYear;
        let endMonth = startMonth + 1;
        if (endMonth > 11) {
            endMonth = 0;
            endYear += 1;
        }
        const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
        const actualEndDay = Math.min(salaryDay - 1, daysInEndMonth);
        endDate = new Date(endYear, endMonth, actualEndDay);
    }

    const formatLabel = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    return {
        startDate: formatLocalDate(startDate),
        endDate: formatLocalDate(endDate),
        label: `${formatLabel(startDate)} - ${formatLabel(endDate)}`
    };
}

export function getDateRange(filterType: FilterType, customStart?: string, customEnd?: string, salaryDay?: number): DateRange {
    const now = new Date();
    const today = formatLocalDate(now);

    switch (filterType) {
        case 'week': {
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday start
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
            const endOfWeek = new Date(now.getFullYear(), now.getMonth(), diff + 6);
            return {
                startDate: formatLocalDate(startOfWeek),
                endDate: formatLocalDate(endOfWeek),
                label: 'This Week'
            };
        }

        case 'month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
                startDate: formatLocalDate(startOfMonth),
                endDate: formatLocalDate(endOfMonth),
                label: 'This Month'
            };
        }

        case 'lastMonth': {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return {
                startDate: formatLocalDate(startOfLastMonth),
                endDate: formatLocalDate(endOfLastMonth),
                label: 'Last Month'
            };
        }

        case '3months': {
            const startOf3Months = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
                startDate: formatLocalDate(startOf3Months),
                endDate: formatLocalDate(endOfMonth),
                label: 'Last 3 Months'
            };
        }

        case 'year': {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31);
            return {
                startDate: formatLocalDate(startOfYear),
                endDate: formatLocalDate(endOfYear),
                label: 'This Year'
            };
        }

        case 'all': {
            return {
                startDate: '1970-01-01',
                endDate: '2099-12-31',
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
    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) return date;
    return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}
