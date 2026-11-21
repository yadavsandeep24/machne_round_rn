import { useCallback, useEffect, useReducer, useRef } from 'react';
import { AppState } from 'react-native';

import type { KeyValueStore } from '../../../core/storage/keyValueStore';
import type { CreatePaymentRequest, PaymentGateway } from '../data/gateway';
import { pendingPaymentStore } from '../data/pendingPaymentStore';
import { transition, type PaymentState } from '../domain/paymentMachine';

export interface PaymentDeps {
  gateway: PaymentGateway;
  store: KeyValueStore;
  /** Opens the UPI app / 3DS page (Linking.openURL in the app). */
  openUrl: (url: string) => Promise<void>;
  newKey: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Poll delays: exponential backoff, total ~60 s, then UNKNOWN. */
  pollDelays?: number[];
}

const DEFAULT_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];
const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function usePayment(request: CreatePaymentRequest, deps: PaymentDeps) {
  const [state, dispatch] = useReducer(transition, { status: 'idle' } as PaymentState);
  const depsRef = useRef(deps);
  useEffect(() => {
    depsRef.current = deps;
  });
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const polling = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const pending = useCallback(() => pendingPaymentStore(depsRef.current.store), []);

  /** Polls until a terminal status or the backoff budget runs out. */
  const poll = useCallback(async (paymentId: string) => {
    if (polling.current) return; // one poller at a time
    polling.current = true;
    const { gateway, sleep = realSleep, pollDelays = DEFAULT_DELAYS } = depsRef.current;
    try {
      for (const delay of pollDelays) {
        await sleep(delay);
        if (!mounted.current) return;
        try {
          const res = await gateway.status(paymentId);
          if (!mounted.current) return;
          dispatch({ type: 'STATUS', status: res.status, reason: res.reason });
          if (res.status !== 'pending') {
            await pending().clear();
            return;
          }
        } catch {
          // Network blip while polling: keep polling. Never conclude "failed".
        }
      }
      dispatch({ type: 'TIMED_OUT' });
    } finally {
      polling.current = false;
    }
  }, [pending]);

  // Relaunch after an app kill: re-check the last in-flight payment.
  useEffect(() => {
    let cancelled = false;
    pending()
      .load()
      .then((p) => {
        if (cancelled || !p) return;
        dispatch({ type: 'RESTORED', ...p });
        void poll(p.paymentId);
      });
    return () => {
      cancelled = true;
    };
  }, [pending, poll]);

  // Returning from the UPI app (or the background) resumes status checks.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      const current = stateRef.current;
      if (current.status === 'awaitingAuthorization') dispatch({ type: 'AUTH_RETURNED' });
      if ('paymentId' in current && (current.status === 'awaitingAuthorization' || current.status === 'processing')) {
        void poll(current.paymentId);
      }
    });
    return () => sub.remove();
  }, [poll]);

  const pay = useCallback(async () => {
    const current = stateRef.current;
    if (current.status !== 'idle' && current.status !== 'failed') return; // double tap
    const { gateway, openUrl, newKey } = depsRef.current;
    const idempotencyKey = newKey(); // one key per attempt; a retry after FAILED gets a new one
    stateRef.current = { status: 'initiating', idempotencyKey }; // block re-entry before re-render
    dispatch({ type: 'PAY', idempotencyKey });
    let created;
    try {
      created = await gateway.create(request, idempotencyKey);
    } catch {
      // Lost response: the payment may exist. Retry ONCE with the same key; the
      // server returns the same payment instead of charging twice.
      try {
        created = await gateway.create(request, idempotencyKey);
      } catch {
        if (mounted.current) dispatch({ type: 'CREATE_FAILED', reason: 'Could not start the payment. You were not charged.' });
        return;
      }
    }
    if (!mounted.current) return;
    await pending().save({ idempotencyKey, paymentId: created.paymentId });
    dispatch({ type: 'CREATED', paymentId: created.paymentId, authorizationUrl: created.authorizationUrl });
    if (created.authorizationUrl) {
      await openUrl(created.authorizationUrl); // polling starts when the user comes back
    } else {
      void poll(created.paymentId);
    }
  }, [request, pending, poll]);

  const checkAgain = useCallback(() => {
    const current = stateRef.current;
    if (current.status === 'unknown') void poll(current.paymentId);
  }, [poll]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, pay, checkAgain, reset };
}
