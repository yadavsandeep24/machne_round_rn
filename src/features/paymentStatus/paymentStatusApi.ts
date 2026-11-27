import type { AxiosInstance } from 'axios';

import { safeCall } from '../../core/network/http';
import { ok, type Result } from '../../core/result';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed';

export const isTerminal = (status: PaymentStatus) => status !== 'pending';

export interface PaymentStatusApi {
  getStatus(paymentId: string): Promise<Result<PaymentStatus>>;
}

/** Real backend: GET /payments/:id -> { status }. */
export function createHttpPaymentStatusApi(http: AxiosInstance): PaymentStatusApi {
  return {
    getStatus: (paymentId) =>
      safeCall(async () => {
        const res = await http.get<{ status: PaymentStatus }>(`payments/${encodeURIComponent(paymentId)}`);
        return res.data.status;
      }),
  };
}

/**
 * Demo / test backend: each payment stays `pending` for `pendingPolls` calls,
 * then settles. Payment ids ending in "-fail" settle as `failed`.
 */
export function createFakePaymentStatusApi(pendingPolls = 2): PaymentStatusApi & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    getStatus: async (paymentId) => {
      calls.push(paymentId);
      const seen = calls.filter((id) => id === paymentId).length;
      if (seen <= pendingPolls) return ok<PaymentStatus>('pending');
      return ok<PaymentStatus>(paymentId.endsWith('-fail') ? 'failed' : 'succeeded');
    },
  };
}
