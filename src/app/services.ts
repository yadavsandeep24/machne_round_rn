import type { AxiosInstance } from 'axios';

import { createHttp } from '../core/network/http';
import { asyncStorageStore, type KeyValueStore } from '../core/storage/keyValueStore';
import { AUTH_BASE_URL, createAuthApi, type AuthApi } from '../features/auth/data/authApi';
import { installAuthInterceptor } from '../features/auth/data/authInterceptor';
import { createSecureTokenStore, type TokenStore } from '../features/auth/data/tokenStore';

export interface Signal {
  subscribe(cb: () => void): () => void;
  emit(): void;
}

export function createSignal(): Signal {
  const listeners = new Set<() => void>();
  return {
    subscribe: (cb) => {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
    emit: () => listeners.forEach((cb) => cb()),
  };
}

export interface Services {
  /** Authenticated client (bearer + refresh). */
  http: AxiosInstance;
  store: KeyValueStore;
  tokens: TokenStore;
  authApi: AuthApi;
  sessionExpired: Signal;
}

/** Wires the pieces; `plain` and `authed` are injectable for tests. */
export function wireServices({
  plain,
  authed,
  tokens,
  store,
}: {
  plain: AxiosInstance;
  authed: AxiosInstance;
  tokens: TokenStore;
  store: KeyValueStore;
}): Services {
  const authApi = createAuthApi(plain);
  const sessionExpired = createSignal();
  installAuthInterceptor(authed, { tokens, authApi, onSessionExpired: sessionExpired.emit });
  return { http: authed, store, tokens, authApi, sessionExpired };
}

export function createServices(): Services {
  return wireServices({
    plain: createHttp(AUTH_BASE_URL),
    authed: createHttp(AUTH_BASE_URL),
    tokens: createSecureTokenStore(),
    store: asyncStorageStore,
  });
}
