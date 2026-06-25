// Currency formatting utilities for Indonesian Rupiah

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export const formatNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format with thousand separators
    return new Intl.NumberFormat('id-ID').format(parseInt(digits) || 0);
};

export const parseFormattedNumber = (value: string): number => {
    // Remove all non-digits and parse
    const digits = value.replace(/\D/g, '');
    return parseInt(digits) || 0;
};
