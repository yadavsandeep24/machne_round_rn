import type { AppError } from './appError';

/** Redux state must be serialisable: drop the raw `cause` (an Error object). */
export function toStateError(error: AppError): AppError {
  const { cause: _cause, ...rest } = error as AppError & { cause?: unknown };
  return rest as AppError;
}
