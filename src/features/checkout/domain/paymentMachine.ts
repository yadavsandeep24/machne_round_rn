/**
 * Explicit payment state machine. The backend is the source of truth; the
 * client only reflects what it knows. The key rule: a timeout is UNKNOWN,
 * never FAILED. Showing "failed" for a payment that actually went through
 * makes users pay twice.
 */
export type PaymentMethod = 'upi' | 'card';

export type PaymentState =
  | { status: 'idle' }
  | { status: 'initiating'; idempotencyKey: string }
  | { status: 'awaitingAuthorization'; idempotencyKey: string; paymentId: string; authorizationUrl: string }
  | { status: 'processing'; idempotencyKey: string; paymentId: string }
  | { status: 'succeeded'; paymentId: string }
  | { status: 'failed'; reason: string; paymentId?: string }
  | { status: 'unknown'; idempotencyKey: string; paymentId: string };

export type PaymentEvent =
  | { type: 'PAY'; idempotencyKey: string }
  | { type: 'CREATED'; paymentId: string; authorizationUrl?: string }
  | { type: 'CREATE_FAILED'; reason: string }
  | { type: 'AUTH_RETURNED' }
  | { type: 'STATUS'; status: 'pending' | 'succeeded' | 'failed'; reason?: string }
  | { type: 'TIMED_OUT' }
  | { type: 'RESTORED'; idempotencyKey: string; paymentId: string }
  | { type: 'RESET' };

/** Pure transition function. Illegal events are ignored (state returned as is). */
export function transition(state: PaymentState, event: PaymentEvent): PaymentState {
  if (state.status === 'succeeded') return state; // nothing undoes a success
  switch (event.type) {
    case 'PAY':
      return state.status === 'idle' || state.status === 'failed'
        ? { status: 'initiating', idempotencyKey: event.idempotencyKey }
        : state; // double tap: ignored
    case 'CREATED':
      if (state.status !== 'initiating') return state;
      return event.authorizationUrl
        ? { status: 'awaitingAuthorization', idempotencyKey: state.idempotencyKey, paymentId: event.paymentId, authorizationUrl: event.authorizationUrl }
        : { status: 'processing', idempotencyKey: state.idempotencyKey, paymentId: event.paymentId };
    case 'CREATE_FAILED':
      return state.status === 'initiating' ? { status: 'failed', reason: event.reason } : state;
    case 'AUTH_RETURNED':
      return state.status === 'awaitingAuthorization'
        ? { status: 'processing', idempotencyKey: state.idempotencyKey, paymentId: state.paymentId }
        : state;
    case 'STATUS': {
      if (!('paymentId' in state) || state.status === 'failed') return state;
      if (event.status === 'succeeded') return { status: 'succeeded', paymentId: state.paymentId };
      if (event.status === 'failed')
        return { status: 'failed', paymentId: state.paymentId, reason: event.reason ?? 'Payment declined' };
      return state.status === 'unknown'
        ? state
        : { status: 'processing', idempotencyKey: state.idempotencyKey, paymentId: state.paymentId };
    }
    case 'TIMED_OUT':
      return state.status === 'processing' || state.status === 'awaitingAuthorization'
        ? { status: 'unknown', idempotencyKey: state.idempotencyKey, paymentId: state.paymentId }
        : state;
    case 'RESTORED':
      return state.status === 'idle'
        ? { status: 'processing', idempotencyKey: event.idempotencyKey, paymentId: event.paymentId }
        : state;
    case 'RESET':
      return state.status === 'failed' || state.status === 'idle' ? { status: 'idle' } : state;
  }
}
