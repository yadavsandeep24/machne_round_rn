import { formatMoney, sumMoney } from '../domain/money';
import { transition, type PaymentState } from '../domain/paymentMachine';

const run = (events: Parameters<typeof transition>[1][], from: PaymentState = { status: 'idle' }) =>
  events.reduce(transition, from);

test('UPI happy path', () => {
  const s = run([
    { type: 'PAY', idempotencyKey: 'k1' },
    { type: 'CREATED', paymentId: 'p1', authorizationUrl: 'upi://pay' },
    { type: 'AUTH_RETURNED' },
    { type: 'STATUS', status: 'pending' },
    { type: 'STATUS', status: 'succeeded' },
  ]);
  expect(s).toEqual({ status: 'succeeded', paymentId: 'p1' });
});

test('a second PAY while initiating is ignored (double tap)', () => {
  const s = run([{ type: 'PAY', idempotencyKey: 'k1' }, { type: 'PAY', idempotencyKey: 'k2' }]);
  expect(s).toEqual({ status: 'initiating', idempotencyKey: 'k1' });
});

test('timeout is UNKNOWN, never FAILED; a late success still lands', () => {
  const s = run([
    { type: 'PAY', idempotencyKey: 'k1' },
    { type: 'CREATED', paymentId: 'p1' },
    { type: 'TIMED_OUT' },
  ]);
  expect(s.status).toBe('unknown');
  expect(transition(s, { type: 'STATUS', status: 'pending' }).status).toBe('unknown');
  expect(transition(s, { type: 'STATUS', status: 'succeeded' }).status).toBe('succeeded');
});

test('nothing moves a succeeded payment', () => {
  const done: PaymentState = { status: 'succeeded', paymentId: 'p1' };
  expect(transition(done, { type: 'STATUS', status: 'failed' })).toBe(done);
  expect(transition(done, { type: 'PAY', idempotencyKey: 'k9' })).toBe(done);
});

test('money: integer minor units, locale formatting, currency mismatch guard', () => {
  const total = sumMoney([{ minor: 49900, currency: 'INR' }, { minor: 8982, currency: 'INR' }], 'INR');
  expect(total.minor).toBe(58882);
  expect(formatMoney(total)).toBe('₹588.82');
  expect(() => sumMoney([{ minor: 1, currency: 'USD' }], 'INR')).toThrow('Currency mismatch');
});
