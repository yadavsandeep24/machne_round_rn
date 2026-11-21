import { readJson, writeJson, type KeyValueStore } from '../../../core/storage/keyValueStore';

/** The in-flight payment survives an app kill, so it can be re-checked at launch. */
export interface PendingPayment {
  idempotencyKey: string;
  paymentId: string;
}

const KEY = 'pending_payment_v1';

export const pendingPaymentStore = (store: KeyValueStore) => ({
  load: () => readJson<PendingPayment | null>(store, KEY, null),
  save: (p: PendingPayment) => writeJson(store, KEY, p),
  clear: () => store.removeItem(KEY),
});
