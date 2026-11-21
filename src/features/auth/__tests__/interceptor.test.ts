import { installAuthInterceptor } from '../data/authInterceptor';
import { createAuthApi } from '../data/authApi';
import type { Session, TokenStore } from '../data/tokenStore';
import { bearer, fakeHttp } from '../../../../test/fakeHttp';
import { mapError } from '../../../core/network/http';

function memoryTokens(initial: Session | null): TokenStore {
  let s = initial;
  return { load: async () => s, save: async (n) => void (s = n), clear: async () => void (s = null), current: () => s };
}

function setup(refreshStatus: number) {
  let refreshCalls = 0;
  const plain = fakeHttp(async () => {
    refreshCalls++;
    await new Promise((r) => setTimeout(r, 10));
    return refreshStatus === 200 ? [200, { accessToken: 'new', refreshToken: 'r2' }] : [refreshStatus, {}];
  });
  const api = fakeHttp((c) => (bearer(c) === 'Bearer new' ? [200, { ok: c.url }] : [401]));
  const tokens = memoryTokens({ accessToken: 'old', refreshToken: 'r1' });
  const onSessionExpired = jest.fn();
  installAuthInterceptor(api.http, { tokens, authApi: createAuthApi(plain.http), onSessionExpired });
  return { http: api.http, tokens, onSessionExpired, refreshCalls: () => refreshCalls };
}

test('5 parallel 401s trigger exactly one refresh; all retry with the new token', async () => {
  const s = setup(200);
  const results = await Promise.all([1, 2, 3, 4, 5].map((i) => s.http.get(`item/${i}`)));
  expect(s.refreshCalls()).toBe(1);
  expect(results.map((r) => r.data.ok)).toEqual(['item/1', 'item/2', 'item/3', 'item/4', 'item/5']);
  expect(s.tokens.current()).toEqual({ accessToken: 'new', refreshToken: 'r2' });
});

test('a rejected refresh token clears the session and reports unauthorized', async () => {
  const s = setup(401);
  const error = await s.http.get('me').catch((e) => e);
  expect(mapError(error).kind).toBe('unauthorized');
  expect(s.tokens.current()).toBeNull();
  expect(s.onSessionExpired).toHaveBeenCalledTimes(1);
});

test('a 5xx during refresh keeps the session (maybe just offline)', async () => {
  const s = setup(503);
  await expect(s.http.get('me')).rejects.toBeTruthy();
  expect(s.tokens.current()).not.toBeNull();
  expect(s.onSessionExpired).not.toHaveBeenCalled();
});
