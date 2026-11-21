import type { AppError } from './error/appError';

/** Repositories return Result instead of throwing. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const err = <T = never>(error: AppError): Result<T> => ({ ok: false, error });
