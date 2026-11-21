import { createMemoryStore } from '../src/core/storage/keyValueStore';
import { wireServices, type Services } from '../src/app/services';
import { createSecureTokenStore } from '../src/features/auth/data/tokenStore';
import { bearer, fakeHttp } from './fakeHttp';

/** Fake auth server: login demo/secret12, /auth/me needs "Bearer a1". */
export function testServices(overrides: Partial<Services> = {}): Services {
  const plain = fakeHttp((c) => {
    if (c.url === 'auth/login') {
      const body = JSON.parse(String(c.data));
      return body.password === 'secret12' ? [200, { accessToken: 'a1', refreshToken: 'r1' }] : [400, { message: 'Invalid credentials' }];
    }
    return [404];
  }).http;
  const authed = fakeHttp((c) =>
    bearer(c) === 'Bearer a1'
      ? [200, { id: 1, username: 'demo', firstName: 'Demo', lastName: 'User', email: 'demo@test.dev' }]
      : [401],
  ).http;
  return { ...wireServices({ plain, authed, tokens: createSecureTokenStore(), store: createMemoryStore() }), ...overrides };
}
