import { AxiosError, create, isCancel, type AxiosInstance } from 'axios';

import type { AppError } from '../error/appError';
import { err, ok, type Result } from '../result';

export const DEFAULT_BASE_URL = 'https://jsonplaceholder.typicode.com/';

export function createHttp(baseURL: string = DEFAULT_BASE_URL): AxiosInstance {
  return create({ baseURL, timeout: 15_000 });
}

/** Runs `block` and converts every failure into a typed AppError. Data layer only. */
export async function safeCall<T>(block: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await block());
  } catch (e) {
    const mapped = mapError(e);
    if (__DEV__ && mapped.kind !== 'cancelled') console.warn('safeCall failed', mapped.kind, e);
    return err(mapped);
  }
}

export function mapError(e: unknown): AppError {
  if (isAppError(e)) return e;
  if (isCancel(e)) return { kind: 'cancelled', cause: e };
  if (e instanceof AxiosError) {
    // Interceptors may attach an AppError (for example a failed token refresh).
    const attached = (e as AxiosError & { appError?: AppError }).appError;
    if (attached) return attached;
    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') return { kind: 'timeout', cause: e };
    const status = e.response?.status;
    if (status === undefined) return { kind: 'noInternet', cause: e };
    if (status === 401 || status === 403) return { kind: 'unauthorized', cause: e };
    if (status === 404) return { kind: 'notFound', cause: e };
    return { kind: 'server', status, cause: e };
  }
  if (e instanceof SyntaxError || e instanceof TypeError) return { kind: 'parse', cause: e };
  return { kind: 'unknown', cause: e };
}

const KINDS = new Set<AppError['kind']>([
  'noInternet',
  'timeout',
  'unauthorized',
  'notFound',
  'server',
  'parse',
  'cancelled',
  'unknown',
]);

export function isAppError(e: unknown): e is AppError {
  return typeof e === 'object' && e !== null && KINDS.has((e as AppError).kind);
}
