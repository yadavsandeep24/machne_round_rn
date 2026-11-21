export type TxnType = 'credit' | 'debit';
export type TxnStatus = 'success' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  type: TxnType;
  status: TxnStatus;
  /** Integer minor units (paise). */
  amountMinor: number;
  counterparty: string;
  note?: string;
  /** ISO 8601 timestamp from the server (UTC). */
  createdAt: string;
}

export interface TxnFilter {
  type: 'all' | TxnType;
  status: 'all' | TxnStatus;
  query: string;
}

export const DEFAULT_FILTER: TxnFilter = { type: 'all', status: 'all', query: '' };

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

/** "+₹1,250.00" for credits, "−₹250.00" for debits. */
export function formatAmount(t: Pick<Transaction, 'type' | 'amountMinor'>): string {
  return `${t.type === 'credit' ? '+' : '−'}${inr.format(t.amountMinor / 100)}`;
}

/** Local calendar-day key, so "Today" follows the user's timezone, not UTC. */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function dayTitle(date: Date, now: Date): string {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const key = dayKey(date);
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

export interface Section {
  key: string;
  title: string;
  /** Net amount for the day, minor units (credits − debits, successful only). */
  netMinor: number;
  data: Transaction[];
}

/** Groups newest-first transactions into day sections, preserving order. */
export function groupByDay(txns: Transaction[], now: Date): Section[] {
  const sections: Section[] = [];
  const index = new Map<string, Section>();
  for (const t of txns) {
    const date = new Date(t.createdAt);
    const key = dayKey(date);
    let section = index.get(key);
    if (!section) {
      section = { key, title: dayTitle(date, now), netMinor: 0, data: [] };
      index.set(key, section);
      sections.push(section);
    }
    section.data.push(t);
    if (t.status === 'success') section.netMinor += t.type === 'credit' ? t.amountMinor : -t.amountMinor;
  }
  return sections;
}
