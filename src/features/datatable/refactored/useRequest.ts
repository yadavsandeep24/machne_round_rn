import { useCallback, useEffect, useReducer, useRef } from 'react';

/** One state object: loading/error/data can never contradict each other. */
export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading'; previous?: T }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string; previous?: T };

type Action<T> =
  | { type: 'start' }
  | { type: 'success'; data: T }
  | { type: 'error'; message: string };

function reducer<T>(state: RequestState<T>, action: Action<T>): RequestState<T> {
  const previous = state.status === 'success' ? state.data : 'previous' in state ? state.previous : undefined;
  switch (action.type) {
    case 'start':
      return { status: 'loading', previous };
    case 'success':
      return { status: 'success', data: action.data };
    case 'error':
      return { status: 'error', message: action.message, previous };
  }
}

/**
 * Reusable "latest request wins" hook.
 * - Each run aborts the previous one (AbortController) AND tags itself with an
 *   id in a ref; a response whose id is not the latest is ignored. Abort saves
 *   bandwidth; the id check also covers APIs that ignore the signal.
 * - Unmount aborts the in-flight request: no state update after unmount.
 */
export function useRequest<TArgs extends unknown[], T>(
  fetcher: (signal: AbortSignal, ...args: TArgs) => Promise<T>,
) {
  const [state, dispatch] = useReducer(reducer<T>, { status: 'idle' });
  const latestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(async (...args: TArgs) => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    const id = ++latestId.current;
    dispatch({ type: 'start' });
    try {
      const data = await fetcherRef.current(ctrl.signal, ...args);
      if (id === latestId.current) dispatch({ type: 'success', data });
    } catch (e) {
      if (ctrl.signal.aborted || id !== latestId.current) return; // superseded, not an error
      dispatch({ type: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => () => controller.current?.abort(), []);

  return { state, run };
}
