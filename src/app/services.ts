import type { AxiosInstance } from 'axios';

import { createHttp } from '../core/network/http';
import { asyncStorageStore, type KeyValueStore } from '../core/storage/keyValueStore';

/**
 * Dependency injection without a container: everything a thunk needs is
 * passed as the thunk `extraArgument`. Tests pass fakes.
 */
export interface Services {
  http: AxiosInstance;
  store: KeyValueStore;
}

export function createServices(): Services {
  return { http: createHttp(), store: asyncStorageStore };
}
