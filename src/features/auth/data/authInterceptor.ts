import { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import type { AuthApi } from './authApi';
import type { TokenStore } from './tokenStore';

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * Bearer header + refresh-once on 401.
 * - Single flight: N parallel 401s share ONE refresh promise.
 * - The retried request is marked so a second 401 cannot loop.
 * - Only 400/401/403 from the refresh endpoint ends the session. A network
 *   error or 5xx keeps it (the user may just be offline): logging people out
 *   on any refresh failure is a classic production bug.
 */
export function installAuthInterceptor(
  http: AxiosInstance,
  { tokens, authApi, onSessionExpired }: { tokens: TokenStore; authApi: AuthApi; onSessionExpired: () => void },
) {
  let refreshing: Promise<string | null> | null = null;

  const refreshOnce = () =>
    (refreshing ??= (async () => {
      const session = tokens.current();
      if (!session) return null;
      try {
        const fresh = await authApi.refresh(session.refreshToken);
        await tokens.save(fresh);
        return fresh.accessToken;
      } catch (e) {
        const status = e instanceof AxiosError ? e.response?.status : undefined;
        if (status === 400 || status === 401 || status === 403) {
          await tokens.clear();
          onSessionExpired();
          return null;
        }
        throw e; // transient: surface the error, keep the session
      } finally {
        refreshing = null;
      }
    })());

  http.interceptors.request.use((config) => {
    const token = tokens.current()?.accessToken;
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  http.interceptors.response.use(undefined, async (error: unknown) => {
    if (!(error instanceof AxiosError) || error.response?.status !== 401 || !error.config) throw error;
    const config = error.config as RetriableConfig;
    if (config._retried) throw error;

    const sent = String(config.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const current = tokens.current()?.accessToken;
    // Someone else already refreshed while this request was in flight.
    const token = current && current !== sent ? current : await refreshOnce();
    if (!token) throw Object.assign(error, { appError: { kind: 'unauthorized' } });

    config._retried = true;
    config.headers.set('Authorization', `Bearer ${token}`);
    return http.request(config);
  });
}
