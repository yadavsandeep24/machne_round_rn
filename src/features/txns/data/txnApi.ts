import type { Transaction, TxnFilter } from '../domain/transaction';

export interface TxnPage {
  items: Transaction[];
  /** Opaque cursor for the next page; null at the end. Cursor (not page number)
   * paging stays correct when new transactions arrive at the top. */
  nextCursor: string | null;
}

export interface TxnApi {
  list(filter: TxnFilter, cursor: string | null, signal?: AbortSignal): Promise<TxnPage>;
}

const MERCHANTS = ['Swiggy', 'Amazon', 'Uber', 'Airtel', 'Zomato', 'BigBasket', 'IRCTC', 'Netflix'];
const PEOPLE = ['Rahul', 'Priya', 'Amit', 'Sneha'];

/** Deterministic fake data set, newest first, one every ~5 hours. */
export function makeTransactions(count: number, newest = Date.now()): Transaction[] {
  return Array.from({ length: count }, (_, i) => {
    const credit = i % 5 === 0;
    return {
      id: `txn_${i + 1}`,
      type: credit ? 'credit' : 'debit',
      status: i % 13 === 7 ? 'failed' : i % 11 === 3 ? 'pending' : 'success',
      amountMinor: ((i * 7919) % 500000) + 1000,
      counterparty: credit ? PEOPLE[i % PEOPLE.length]! : MERCHANTS[i % MERCHANTS.length]!,
      note: credit ? 'Received via UPI' : undefined,
      createdAt: new Date(newest - i * 5 * 3600_000).toISOString(),
    };
  });
}

export function matches(t: Transaction, f: TxnFilter): boolean {
  if (f.type !== 'all' && t.type !== f.type) return false;
  if (f.status !== 'all' && t.status !== f.status) return false;
  const q = f.query.trim().toLowerCase();
  return !q || t.counterparty.toLowerCase().includes(q) || (t.note ?? '').toLowerCase().includes(q);
}

/** In-memory "server" for the demo. Filtering happens server-side. */
export function createFakeTxnApi(all: Transaction[], { pageSize = 20, latencyMs = 400 } = {}): TxnApi {
  return {
    async list(filter, cursor, signal) {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, latencyMs);
        signal?.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('aborted'));
        });
      });
      const filtered = all.filter((t) => matches(t, filter));
      const start = cursor ? filtered.findIndex((t) => t.id === cursor) + 1 : 0;
      const items = filtered.slice(start, start + pageSize);
      const last = items[items.length - 1];
      return { items, nextCursor: start + pageSize < filtered.length && last ? last.id : null };
    },
  };
}
