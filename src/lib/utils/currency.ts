/**
 * Utility functions for Indian currency formatting
 */

/**
 * Format amount in Indian currency format
 * @param amount - Amount in rupees
 * @param options - Formatting options
 */
export function formatIndianCurrency(
  amount: number,
  options: {
    showSymbol?: boolean;
    compact?: boolean;
    decimals?: number;
  } = {}
): string {
  const { showSymbol = true, compact = false, decimals = 0 } = options;

  if (amount === 0) {
    return showSymbol ? '₹0' : '0';
  }

  // For compact format, use Indian numbering system
  if (compact) {
    if (amount >= 10000000) {
      // Crores
      const crores = amount / 10000000;
      return `${showSymbol ? '₹' : ''}${crores.toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // Lakhs
      const lakhs = amount / 100000;
      return `${showSymbol ? '₹' : ''}${lakhs.toFixed(1)}L`;
    } else if (amount >= 1000) {
      // Thousands
      const thousands = amount / 1000;
      return `${showSymbol ? '₹' : ''}${thousands.toFixed(1)}K`;
    }
  }

  // Standard Indian number formatting
  const formatted = new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return showSymbol ? formatted : formatted.replace('₹', '').trim();
}

/**
 * Format loan amount for display in cards and tables
 */
export function formatLoanAmount(amount: number): string {
  return formatIndianCurrency(amount, { compact: true });
}

/**
 * Format full currency amount with proper Indian formatting
 */
export function formatFullCurrency(amount: number): string {
  return formatIndianCurrency(amount, { showSymbol: true, decimals: 0 });
}

/**
 * Format percentage with Indian locale
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number with Indian locale (without currency symbol)
 */
export function formatIndianNumber(value: number): string {
  return value?.toLocaleString('en-IN');
}
