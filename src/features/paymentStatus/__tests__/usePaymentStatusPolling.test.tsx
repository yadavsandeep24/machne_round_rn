import { act, renderHook } from '@testing-library/react-native';

import { err, ok } from '../../../core/result';
import { createFakePaymentStatusApi, type PaymentStatus, type PaymentStatusApi } from '../paymentStatusApi';
import { usePaymentStatusPolling, usePaymentStatusPollingLegacy, type PollingArgs } from '../usePaymentStatusPolling';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

/** Lets queued promise callbacks run, then moves fake time forward. */
async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

type Hook = typeof usePaymentStatusPolling;

describe.each<[string, Hook]>([
  ['useEffectEvent (new)', usePaymentStatusPolling],
  ['latest-ref pattern (old)', usePaymentStatusPollingLegacy],
])('%s', (_name, useHook) => {
  const setup = async (api: PaymentStatusApi, initial: Partial<PollingArgs> = {}) => {
    const initialProps: PollingArgs = { api, paymentId: 'pay_1', onSettled: jest.fn(), intervalMs: 1000, ...initial };
    return renderHook((props: PollingArgs) => useHook(props), { initialProps });
  };

  test('polls until the payment settles, then stops', async () => {
    const api = createFakePaymentStatusApi(2);
    const onSettled = jest.fn();
    const { result } = await setup(api, { onSettled });

    await advance(0);
    expect(result.current).toMatchObject({ status: 'pending', attempts: 1 });

    await advance(2000);
    expect(result.current).toMatchObject({ status: 'succeeded', attempts: 3 });
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith('succeeded');

    await advance(10_000);
    expect(api.calls).toHaveLength(3); // no polling after settle
  });

  test('a new onSettled on every render does NOT restart polling, and the LATEST one is called', async () => {
    const api = createFakePaymentStatusApi(3);
    const first = jest.fn();
    const latest = jest.fn();
    const { rerender } = await setup(api, { onSettled: first });

    await advance(0);
    for (let i = 0; i < 5; i++) await rerender({ api, paymentId: 'pay_1', intervalMs: 1000, onSettled: jest.fn() });
    await rerender({ api, paymentId: 'pay_1', intervalMs: 1000, onSettled: latest });
    expect(api.calls).toHaveLength(1); // re-renders did not trigger extra requests

    await advance(3000);
    expect(api.calls).toHaveLength(4);
    expect(first).not.toHaveBeenCalled(); // no stale closure
    expect(latest).toHaveBeenCalledWith('succeeded');
  });

  test('changing paymentId cancels the old loop and starts fresh state', async () => {
    const api = createFakePaymentStatusApi(5);
    const { result, rerender } = await setup(api);
    await advance(1000);
    expect(result.current.attempts).toBe(2);

    await rerender({ api, paymentId: 'pay_2', intervalMs: 1000, onSettled: jest.fn() });
    // Fresh state for the new payment: its own first check, not pay_1's count of 2.
    expect(result.current).toMatchObject({ paymentId: 'pay_2', attempts: 1, status: 'pending' });

    await advance(1000);
    expect(api.calls.filter((id) => id === 'pay_1')).toHaveLength(2); // old loop stopped
    expect(result.current).toMatchObject({ paymentId: 'pay_2', attempts: 2 });
  });

  test('keeps polling through a transient error and gives up after maxAttempts', async () => {
    let n = 0;
    const api: PaymentStatusApi = {
      getStatus: async () => (++n === 1 ? err({ kind: 'timeout' }) : ok<PaymentStatus>('pending')),
    };
    const onSettled = jest.fn();
    const { result } = await setup(api, { onSettled, maxAttempts: 3 });

    await advance(0);
    expect(result.current.error).toEqual({ kind: 'timeout' });

    await advance(5000);
    expect(n).toBe(3);
    expect(result.current).toMatchObject({ attempts: 3, timedOut: true, status: 'pending' });
    expect(onSettled).not.toHaveBeenCalled();
  });

  test('unmount stops polling', async () => {
    const api = createFakePaymentStatusApi(10);
    const { unmount } = await setup(api);
    await advance(0);
    await unmount();
    await advance(5000);
    expect(api.calls).toHaveLength(1);
  });
});
