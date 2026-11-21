import type { Money } from '../domain/money';
import type { PaymentMethod } from '../domain/paymentMachine';

export interface CreatePaymentRequest {
  orderId: string;
  amount: Money;
  method: PaymentMethod;
}

export interface CreatePaymentResponse {
  paymentId: string;
  /** UPI intent / 3-D Secure page the user must approve in, if any. */
  authorizationUrl?: string;
}

export interface PaymentGateway {
  /** Idempotent: the same key returns the same payment, never a second charge. */
  create(req: CreatePaymentRequest, idempotencyKey: string): Promise<CreatePaymentResponse>;
  status(paymentId: string): Promise<{ status: 'pending' | 'succeeded' | 'failed'; reason?: string }>;
}

/** Demo gateway: UPI asks for approval, then succeeds after a few polls. */
export function createDemoGateway(): PaymentGateway {
  const byKey = new Map<string, CreatePaymentResponse>();
  const polls = new Map<string, number>();
  return {
    async create(req, key) {
      await new Promise((r) => setTimeout(r, 400));
      const existing = byKey.get(key);
      if (existing) return existing; // idempotency
      const paymentId = `pay_${byKey.size + 1}`;
      const res: CreatePaymentResponse = {
        paymentId,
        authorizationUrl: req.method === 'upi' ? `upi://pay?pa=merchant@bank&am=${req.amount.minor / 100}&tr=${paymentId}` : undefined,
      };
      byKey.set(key, res);
      return res;
    },
    async status(paymentId) {
      const n = (polls.get(paymentId) ?? 0) + 1;
      polls.set(paymentId, n);
      return { status: n >= 3 ? 'succeeded' : 'pending' };
    },
  };
}
