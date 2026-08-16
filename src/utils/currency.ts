// Currency formatting utilities for Indonesian Rupiah

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

export const formatNumber = (value: string | number): string => {
    if (value === null || value === undefined || value === '') return '';
    const strVal = typeof value === 'number' ? value.toString() : value;
    // Remove all non-digits
    const digits = strVal.replace(/\D/g, '');
    if (!digits) return '';
    // Format with thousand separators
    return new Intl.NumberFormat('id-ID').format(parseInt(digits, 10));
};

export const parseFormattedNumber = (value: string | number): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    // Remove all non-digits and parse
    const digits = value.replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : 0;
};
