import { AxiosError, AxiosHeaders, CanceledError } from 'axios';

import { mapError, safeCall } from '../network/http';

const config = { headers: new AxiosHeaders() };
const withStatus = (status: number) =>
  new AxiosError('x', 'ERR_BAD_RESPONSE', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data: null,
  });

test('success is wrapped', async () => {
  expect(await safeCall(async () => 42)).toEqual({ ok: true, data: 42 });
});

test('maps HTTP status codes', () => {
  expect(mapError(withStatus(401)).kind).toBe('unauthorized');
  expect(mapError(withStatus(404)).kind).toBe('notFound');
  expect(mapError(withStatus(500))).toMatchObject({ kind: 'server', status: 500 });
});

test('maps timeouts, offline and cancellation', () => {
  expect(mapError(new AxiosError('t', 'ECONNABORTED', config)).kind).toBe('timeout');
  expect(mapError(new AxiosError('n', 'ERR_NETWORK', config)).kind).toBe('noInternet');
  expect(mapError(new CanceledError()).kind).toBe('cancelled');
});

test('parse errors and unknowns', async () => {
  const r = await safeCall(async () => JSON.parse('{bad'));
  expect(r).toMatchObject({ ok: false, error: { kind: 'parse' } });
  expect(mapError('weird').kind).toBe('unknown');
});

test('passes through an AppError attached by an interceptor', () => {
  const e = withStatus(401) as AxiosError & { appError?: unknown };
  e.appError = { kind: 'unauthorized' };
  expect(mapError(e).kind).toBe('unauthorized');
});
