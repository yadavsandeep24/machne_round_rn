import type { AppError } from '../../core/error/appError';
import { isTerminal, type PaymentStatus, type PaymentStatusApi } from './paymentStatusApi';

export interface PollSnapshot {
  paymentId: string;
  status: PaymentStatus;
  attempts: number;
  error?: AppError;
  timedOut?: boolean;
}

export interface PollOptions {
  api: PaymentStatusApi;
  paymentId: string;
  intervalMs: number;
  maxAttempts: number;
  onUpdate: (snapshot: PollSnapshot) => void;
  onSettled: (status: PaymentStatus) => void;
}

/**
 * Plain-JS poller. Uses a setTimeout chain (not setInterval) so a slow
 * request never overlaps the next one. Returns a cancel function.
 */
export function pollPaymentStatus({ api, paymentId, intervalMs, maxAttempts, onUpdate, onSettled }: PollOptions) {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;
  let last: PaymentStatus = 'pending';

  const tick = async () => {
    attempts += 1;
    const result = await api.getStatus(paymentId);
    if (cancelled) return; // screen left or paymentId changed while the request was in flight
    if (result.ok) {
      last = result.data;
      onUpdate({ paymentId, status: last, attempts });
      if (isTerminal(last)) {
        onSettled(last);
        return;
      }
    } else {
      onUpdate({ paymentId, status: last, attempts, error: result.error }); // keep polling: errors may be transient
    }
    if (attempts >= maxAttempts) {
      onUpdate({ paymentId, status: last, attempts, timedOut: true });
      return;
    }
    timer = setTimeout(tick, intervalMs);
  };

  void tick();
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}
