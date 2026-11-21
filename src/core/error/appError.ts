/**
 * Every failure the UI can see. The data layer maps raw errors (axios,
 * JSON parsing) into one of these, so components never import axios.
 * A discriminated union: `switch (error.kind)` is checked for exhaustiveness.
 */
export type AppError =
  | { kind: 'noInternet'; cause?: unknown }
  | { kind: 'timeout'; cause?: unknown }
  | { kind: 'unauthorized'; cause?: unknown }
  | { kind: 'notFound'; cause?: unknown }
  | { kind: 'server'; status?: number; cause?: unknown }
  | { kind: 'parse'; cause?: unknown }
  | { kind: 'cancelled'; cause?: unknown }
  | { kind: 'unknown'; cause?: unknown };

export function userMessage(error: AppError): string {
  switch (error.kind) {
    case 'noInternet':
      return 'No internet connection. Check your network and try again.';
    case 'timeout':
      return 'The request timed out. Please try again.';
    case 'unauthorized':
      return 'Your session has expired. Please sign in again.';
    case 'notFound':
      return 'We could not find what you were looking for.';
    case 'server':
      return `Something went wrong on our side (${error.status ?? '?'}). Please try again.`;
    case 'parse':
      return 'We received unexpected data. Please try again later.';
    case 'cancelled':
      return 'The request was cancelled.';
    case 'unknown':
      return 'Something went wrong. Please try again.';
  }
}
