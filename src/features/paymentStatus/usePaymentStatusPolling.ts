import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';

import type { PaymentStatus, PaymentStatusApi } from './paymentStatusApi';
import { pollPaymentStatus, type PollSnapshot } from './pollPaymentStatus';

export interface PollingArgs {
  api: PaymentStatusApi;
  paymentId: string;
  /** Called once when the payment succeeds or fails. May be a new inline function on every render. */
  onSettled: (status: PaymentStatus) => void;
  intervalMs?: number;
  maxAttempts?: number;
}

/** State is keyed by paymentId, so a new payment starts fresh without a setState inside the effect. */
function useSnapshot(paymentId: string) {
  const [snapshot, setSnapshot] = useState<PollSnapshot | null>(null);
  const current: PollSnapshot =
    snapshot?.paymentId === paymentId ? snapshot : { paymentId, status: 'pending', attempts: 0 };
  return [current, setSnapshot] as const;
}

/**
 * NEW WAY (React 19.2+): `useEffectEvent`.
 *
 * The effect re-runs only when the payment, the API or the timing changes.
 * `onSettled` is NOT a dependency: the Effect Event always calls the latest
 * version, so it can read the latest props/state (for example a toggle the
 * user flipped while waiting) without restarting the polling loop.
 */
export function usePaymentStatusPolling({ api, paymentId, onSettled, intervalMs = 1500, maxAttempts = 20 }: PollingArgs) {
  const [snapshot, setSnapshot] = useSnapshot(paymentId);
  const onSettledEvent = useEffectEvent((status: PaymentStatus) => onSettled(status));

  useEffect(
    () =>
      pollPaymentStatus({
        api,
        paymentId,
        intervalMs,
        maxAttempts,
        onUpdate: setSnapshot,
        onSettled: (status) => onSettledEvent(status),
      }),
    [api, paymentId, intervalMs, maxAttempts, setSnapshot],
  );

  return snapshot;
}

/**
 * OLD WAY (before React 19.2), kept for comparison: the "latest ref" pattern.
 * Works, but it is boilerplate every team writes slightly differently, and
 * nothing stops someone from reading the ref during render.
 */
export function usePaymentStatusPollingLegacy({ api, paymentId, onSettled, intervalMs = 1500, maxAttempts = 20 }: PollingArgs) {
  const [snapshot, setSnapshot] = useSnapshot(paymentId);
  const onSettledRef = useRef(onSettled);
  useLayoutEffect(() => {
    onSettledRef.current = onSettled;
  });

  useEffect(
    () =>
      pollPaymentStatus({
        api,
        paymentId,
        intervalMs,
        maxAttempts,
        onUpdate: setSnapshot,
        onSettled: (status) => onSettledRef.current(status),
      }),
    [api, paymentId, intervalMs, maxAttempts, setSnapshot],
  );

  return snapshot;
}
