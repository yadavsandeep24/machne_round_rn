import type { AxiosInstance } from 'axios';

import { createHttp } from '../core/network/http';
import { asyncStorageStore, type KeyValueStore } from '../core/storage/keyValueStore';
import { createFakePaymentStatusApi, type PaymentStatusApi } from '../features/paymentStatus/paymentStatusApi';

/**
 * Dependency injection without a container: everything a thunk needs is
 * passed as the thunk `extraArgument`. Tests pass fakes.
 */
export interface Services {
  http: AxiosInstance;
  store: KeyValueStore;
  payments: PaymentStatusApi;
}

export function createServices(): Services {
  // No payments backend in this demo. With a real API: createHttpPaymentStatusApi(http).
  return { http: createHttp(), store: asyncStorageStore, payments: createFakePaymentStatusApi() };
}
