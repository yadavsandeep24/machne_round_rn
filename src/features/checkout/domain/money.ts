/** Money is always an integer in minor units (paise/cents). Never a float. */
export interface Money {
  minor: number;
  currency: 'INR' | 'USD' | 'EUR';
}

const DIGITS: Record<Money['currency'], number> = { INR: 2, USD: 2, EUR: 2 };

export function formatMoney({ minor, currency }: Money, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    minor / 10 ** DIGITS[currency],
  );
}

export const sumMoney = (items: Money[], currency: Money['currency']): Money => ({
  minor: items.reduce((total, m) => {
    if (m.currency !== currency) throw new Error('Currency mismatch');
    return total + m.minor;
  }, 0),
  currency,
});
