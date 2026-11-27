import axios from 'axios';

import type { Services } from '../src/app/services';
import { createMemoryStore } from '../src/core/storage/keyValueStore';
import { createFakePaymentStatusApi } from '../src/features/paymentStatus/paymentStatusApi';

/** Services for tests: no real network, in-memory storage. */
export function testServices(overrides: Partial<Services> = {}): Services {
  return { http: axios.create(), store: createMemoryStore(), payments: createFakePaymentStatusApi(), ...overrides };
}
