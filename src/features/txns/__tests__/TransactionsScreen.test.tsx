import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { createFakeTxnApi, makeTransactions, type TxnApi } from '../data/txnApi';
import { TransactionsScreen } from '../ui/TransactionsScreen';

const NOW = new Date(2026, 10, 22, 23, 0);
const all = makeTransactions(45, NOW.getTime());

function countingApi(inner: TxnApi) {
  const calls: { filter: string; cursor: string | null }[] = [];
  const api: TxnApi = {
    list: (f, cursor, signal) => {
      calls.push({ filter: `${f.type}/${f.status}/${f.query}`, cursor });
      return inner.list(f, cursor, signal);
    },
  };
  return { api, calls };
}

test('first page grouped by day, then cursor pages until the end', async () => {
  const { api, calls } = countingApi(createFakeTxnApi(all, { latencyMs: 0 }));
  const { getByText } = await render(<TransactionsScreen api={api} now={() => NOW} debounceMs={0} />);
  expect(await screen.findByText('Today')).toBeTruthy();
  expect(getByText('Yesterday')).toBeTruthy();

  const list = screen.getByTestId('txn-list');
  await fireEvent(list, 'endReached');
  await waitFor(() => expect(calls).toHaveLength(2));
  await fireEvent(list, 'endReached');
  await waitFor(() => expect(calls).toHaveLength(3));
  await fireEvent(list, 'endReached'); // end reached: ignored
  expect(calls.map((c) => c.cursor)).toEqual([null, 'txn_20', 'txn_40']);
});

test('changing a filter aborts the old request and starts again from page 1', async () => {
  const aborted: string[] = [];
  const inner = createFakeTxnApi(all, { latencyMs: 30 });
  const api: TxnApi = {
    list: (f, c, signal) => {
      signal?.addEventListener('abort', () => aborted.push(f.type));
      return inner.list(f, c, signal);
    },
  };
  await render(<TransactionsScreen api={api} now={() => NOW} debounceMs={0} />);
  await fireEvent.press(screen.getByText('Received')); // before the first page arrives
  await waitFor(() => expect(screen.getAllByText('Rahul').length).toBeGreaterThan(0));
  expect(aborted).toContain('all');
  expect(screen.queryByText('Swiggy')).toBeNull(); // debits never shown for "Received"
});

test('search filters server-side; no match shows the empty state', async () => {
  await render(<TransactionsScreen api={createFakeTxnApi(all, { latencyMs: 0 })} now={() => NOW} debounceMs={0} />);
  await screen.findByText('Today');
  await fireEvent.changeText(screen.getByLabelText('Search transactions'), 'netflix');
  // Netflix is already on the first page, so wait for the others to go.
  await waitFor(() => expect(screen.queryByText('Swiggy')).toBeNull());
  expect(screen.getAllByText('Netflix').length).toBeGreaterThan(0);
  await fireEvent.changeText(screen.getByLabelText('Search transactions'), 'zzz');
  expect(await screen.findByText('No transactions match these filters')).toBeTruthy();
});

test('first-page error shows Retry; Retry recovers', async () => {
  let fail = true;
  const inner = createFakeTxnApi(all, { latencyMs: 0 });
  const api: TxnApi = { list: (f, c, s) => (fail ? Promise.reject(new Error('down')) : inner.list(f, c, s)) };
  await render(<TransactionsScreen api={api} now={() => NOW} debounceMs={0} />);
  expect(await screen.findByText('Could not load transactions.')).toBeTruthy();
  fail = false;
  await fireEvent.press(screen.getByText('Retry'));
  expect(await screen.findByText('Today')).toBeTruthy();
});

test('rows read well for screen readers', async () => {
  await render(<TransactionsScreen api={createFakeTxnApi(all, { latencyMs: 0 })} now={() => NOW} debounceMs={0} />);
  await screen.findByText('Today');
  expect(screen.getAllByLabelText(/^Received from Rahul, \+₹/).length).toBeGreaterThan(0);
});
