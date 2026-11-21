import { formatAmount, groupByDay, type Transaction } from '../domain/transaction';

const now = new Date(2026, 10, 22, 15, 0); // local time, 22 Nov 2026 15:00
const at = (y: number, m: number, d: number, h = 10) => new Date(y, m, d, h).toISOString();
const txn = (id: string, createdAt: string, type: Transaction['type'] = 'debit', amountMinor = 10000, status: Transaction['status'] = 'success'): Transaction => ({
  id, type, status, amountMinor, counterparty: 'X', createdAt,
});

test('groups into Today, Yesterday and dates, keeping order', () => {
  const sections = groupByDay(
    [txn('a', at(2026, 10, 22, 9)), txn('b', at(2026, 10, 22, 1)), txn('c', at(2026, 10, 21)), txn('d', at(2026, 10, 3)), txn('e', at(2025, 11, 31))],
    now,
  );
  expect(sections.map((s) => s.title)).toEqual(['Today', 'Yesterday', '3 Nov', '31 Dec 2025']);
  expect(sections[0]!.data.map((t) => t.id)).toEqual(['a', 'b']);
});

test('day net counts only successful transactions', () => {
  const [today] = groupByDay(
    [txn('a', at(2026, 10, 22), 'credit', 50000), txn('b', at(2026, 10, 22), 'debit', 20000), txn('c', at(2026, 10, 22), 'debit', 99900, 'failed')],
    now,
  );
  expect(today!.netMinor).toBe(30000);
});

test('formats signed INR amounts', () => {
  expect(formatAmount({ type: 'credit', amountMinor: 125000 })).toBe('+₹1,250.00');
  expect(formatAmount({ type: 'debit', amountMinor: 25050 })).toBe('−₹250.50');
});
