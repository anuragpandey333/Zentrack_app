// Currency conversion rates (base: USD)
const RATES = {
    USD: 1,
    INR: 83.12,
    EUR: 0.92,
    GBP: 0.79
};

const SYMBOLS = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£'
};

export const convertCurrency = (amount, fromCurrency = 'USD', toCurrency = 'USD') => {
    const amountInUSD = amount / RATES[fromCurrency];
    return amountInUSD * RATES[toCurrency];
};

export const formatCurrency = (amount, currency = 'USD') => {
    const symbol = SYMBOLS[currency] || '$';
    const formatted = amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `${symbol}${formatted}`;
};

export const getCurrencySymbol = (currency = 'USD') => {
    return SYMBOLS[currency] || '$';
};
