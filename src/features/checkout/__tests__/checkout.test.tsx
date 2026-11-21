import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { createMemoryStore } from '../../../core/storage/keyValueStore';
import type { CreatePaymentResponse, PaymentGateway } from '../data/gateway';
import { CheckoutScreen, type CartLine } from '../ui/CheckoutScreen';
import { usePayment, type PaymentDeps } from '../ui/usePayment';

const LINES: CartLine[] = [{ id: 'a', title: 'Plan', price: { minor: 10000, currency: 'INR' } }];

let appStateHandlers: ((s: AppStateStatus) => void)[] = [];
beforeEach(() => {
  appStateHandlers = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, h) => {
    appStateHandlers.push(h as (s: AppStateStatus) => void);
    return { remove: jest.fn() } as never;
  });
});
const returnToApp = () => act(async () => appStateHandlers.forEach((h) => h('active')));

function fakeGateway(statuses: ('pending' | 'succeeded' | 'failed')[], opts: { failFirstCreate?: boolean; card?: boolean } = {}) {
  const creates: string[] = [];
  const byKey = new Map<string, CreatePaymentResponse>();
  let failNext = !!opts.failFirstCreate;
  const queue = [...statuses];
  const gateway: PaymentGateway = {
    async create(_req, key) {
      creates.push(key);
      if (failNext) {
        failNext = false;
        // The server DID create it, but the response was lost.
        byKey.set(key, { paymentId: 'pay_1', authorizationUrl: opts.card ? undefined : 'upi://pay' });
        throw new Error('timeout');
      }
      const existing = byKey.get(key) ?? { paymentId: `pay_${byKey.size + 1}`, authorizationUrl: opts.card ? undefined : 'upi://pay' };
      byKey.set(key, existing);
      return existing;
    },
    async status() {
      return { status: queue.shift() ?? 'pending' };
    },
  };
  return { gateway, creates, uniquePayments: () => new Set([...byKey.values()].map((v) => v.paymentId)).size };
}

function deps(gateway: PaymentGateway, extra: Partial<PaymentDeps> = {}): PaymentDeps {
  let n = 0;
  return {
    gateway,
    store: createMemoryStore(),
    openUrl: jest.fn(async () => undefined),
    newKey: () => `key_${++n}`,
    sleep: async () => undefined,
    pollDelays: [1, 1, 1, 1],
    ...extra,
  };
}

test('UPI: opens the app, polls after returning, shows success', async () => {
  const { gateway } = fakeGateway(['pending', 'succeeded']);
  const d = deps(gateway);
  await render(<CheckoutScreen orderId="o1" lines={LINES} deps={d} />);
  await fireEvent.press(screen.getByText('Pay ₹100.00'));
  expect(await screen.findByText('Approve the payment in your UPI app')).toBeTruthy();
  expect(d.openUrl).toHaveBeenCalledWith('upi://pay');
  await returnToApp();
  expect(await screen.findByText('Paid ₹100.00')).toBeTruthy();
});

test('double tap on Pay creates one payment', async () => {
  const { gateway, creates } = fakeGateway(['succeeded'], { card: true });
  const request = { orderId: 'o1', amount: { minor: 10000, currency: 'INR' as const }, method: 'card' as const };
  const { result } = await renderHook(() => usePayment(request, deps(gateway)));
  // Two taps in the same frame, before React re-renders.
  await act(async () => {
    void result.current.pay();
    void result.current.pay();
  });
  await waitFor(() => expect(result.current.state.status).toBe('succeeded'));
  expect(creates).toEqual(['key_1']);
});

test('lost create response: retried with the SAME key, one payment only', async () => {
  const g = fakeGateway(['succeeded'], { failFirstCreate: true, card: true });
  await render(<CheckoutScreen orderId="o1" lines={LINES} deps={deps(g.gateway)} />);
  await fireEvent.press(screen.getByText('Pay ₹100.00'));
  await screen.findByText('Paid ₹100.00');
  expect(g.creates).toEqual(['key_1', 'key_1']);
  expect(g.uniquePayments()).toBe(1);
});

test('no answer within the polling budget: UNKNOWN (never "failed"), then Check status', async () => {
  const { gateway } = fakeGateway(['pending', 'pending', 'pending', 'pending', 'succeeded'], { card: true });
  await render(<CheckoutScreen orderId="o1" lines={LINES} deps={deps(gateway)} />);
  await fireEvent.press(screen.getByText('Pay ₹100.00'));
  expect(await screen.findByText('We’re confirming your payment')).toBeTruthy();
  expect(screen.queryByText(/failed/i)).toBeNull();
  await fireEvent.press(screen.getByText('Check status'));
  expect(await screen.findByText('Paid ₹100.00')).toBeTruthy();
});

test('declined: shows the reason and retries with a NEW key', async () => {
  const g = fakeGateway(['failed', 'succeeded'], { card: true });
  await render(<CheckoutScreen orderId="o1" lines={LINES} deps={deps(g.gateway)} />);
  await fireEvent.press(screen.getByText('Pay ₹100.00'));
  expect(await screen.findByText('Payment declined')).toBeTruthy();
  await fireEvent.press(screen.getByText('Try again · ₹100.00'));
  await screen.findByText('Paid ₹100.00');
  expect(g.creates).toEqual(['key_1', 'key_2']);
});

test('app killed mid-payment: on relaunch the last payment is re-checked', async () => {
  const store = createMemoryStore({ pending_payment_v1: JSON.stringify({ idempotencyKey: 'k', paymentId: 'pay_9' }) });
  const { gateway } = fakeGateway(['succeeded']);
  await render(<CheckoutScreen orderId="o1" lines={LINES} deps={deps(gateway, { store })} />);
  expect(await screen.findByText('Paid ₹100.00')).toBeTruthy();
  await waitFor(async () => expect(await store.getItem('pending_payment_v1')).toBeNull());
});
