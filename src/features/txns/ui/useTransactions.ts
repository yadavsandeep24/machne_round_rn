import { useCallback, useEffect, useReducer, useRef } from 'react';

import type { TxnApi } from '../data/txnApi';
import type { Transaction, TxnFilter } from '../domain/transaction';

interface State {
  items: Transaction[];
  cursor: string | null;
  status: 'loading' | 'ready' | 'error';
  loadingMore: boolean;
  moreError: boolean;
  end: boolean;
  refreshing: boolean;
}

type Action =
  | { type: 'reset' }
  | { type: 'refresh' }
  | { type: 'page'; items: Transaction[]; cursor: string | null; append: boolean }
  | { type: 'firstError' }
  | { type: 'moreStart' }
  | { type: 'moreError' };

const initial: State = { items: [], cursor: null, status: 'loading', loadingMore: false, moreError: false, end: false, refreshing: false };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'reset':
      return initial;
    case 'refresh':
      return { ...s, refreshing: true };
    case 'page': {
      // Dedupe by id in case the server shifted items.
      const seen = new Set(a.append ? s.items.map((t) => t.id) : []);
      const items = a.append ? [...s.items, ...a.items.filter((t) => !seen.has(t.id))] : a.items;
      return { ...s, items, cursor: a.cursor, end: a.cursor == null, status: 'ready', loadingMore: false, moreError: false, refreshing: false };
    }
    case 'firstError':
      return { ...s, status: s.items.length ? 'ready' : 'error', refreshing: false };
    case 'moreStart':
      return { ...s, loadingMore: true, moreError: false };
    case 'moreError':
      return { ...s, loadingMore: false, moreError: true };
  }
}

/**
 * Filter changes are a NEW query: reset, abort whatever was in flight (first
 * page or load-more for the old filter), and start from the first page.
 */
export function useTransactions(api: TxnApi, filter: TxnFilter) {
  const [state, dispatch] = useReducer(reducer, initial);
  const controller = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const start = useCallback(
    async (mode: 'reset' | 'refresh') => {
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      dispatch({ type: mode });
      try {
        const page = await api.list(filter, null, ctrl.signal);
        if (!ctrl.signal.aborted) dispatch({ type: 'page', items: page.items, cursor: page.nextCursor, append: false });
      } catch {
        if (!ctrl.signal.aborted) dispatch({ type: 'firstError' });
      }
    },
    [api, filter],
  );

  useEffect(() => {
    void start('reset');
    return () => controller.current?.abort();
  }, [start]);

  const loadMore = useCallback(
    async (isRetry = false) => {
      const s = stateRef.current;
      if (s.status !== 'ready' || s.loadingMore || s.end || s.refreshing || (s.moreError && !isRetry)) return;
      stateRef.current = { ...s, loadingMore: true }; // guard against a second call this frame
      const ctrl = controller.current;
      dispatch({ type: 'moreStart' });
      try {
        const page = await api.list(filter, s.cursor, ctrl?.signal);
        if (!ctrl?.signal.aborted) dispatch({ type: 'page', items: page.items, cursor: page.nextCursor, append: true });
      } catch {
        if (!ctrl?.signal.aborted) dispatch({ type: 'moreError' });
      }
    },
    [api, filter],
  );

  return {
    state,
    refresh: useCallback(() => void start('refresh'), [start]),
    retry: useCallback(() => void start('reset'), [start]),
    loadMore,
  };
}
