import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { ThunkConfig } from '../../../app/store';
import type { AppError } from '../../../core/error/appError';
import { toStateError } from '../../../core/error/serializable';
import type { Page } from '../data/postRepository';
import type { Post } from '../domain/post';

export type Status = 'loading' | 'success' | 'failure';

export interface PostsState {
  status: Status;
  items: Post[];
  isRefreshing: boolean;
  /** Full-screen when items is empty, otherwise a banner over cached data. */
  error?: AppError;
  nextPage: number;
  isLoadingMore: boolean;
  hasReachedEnd: boolean;
  /** Footer error. While set, scrolling does not retry; the user taps Retry. */
  loadMoreError?: AppError;
  /** Bumped by every refresh, so a page that started earlier is dropped. */
  generation: number;
  /** Trimmed query the results belong to. Empty = browse mode. */
  query: string;
  searchStatus: 'idle' | Status;
  searchResults: Post[];
  searchError?: AppError;
}

const initialState: PostsState = {
  status: 'loading',
  items: [],
  isRefreshing: false,
  nextPage: 2,
  isLoadingMore: false,
  hasReachedEnd: false,
  generation: 0,
  query: '',
  searchStatus: 'idle',
  searchResults: [],
};

type Rejectable = ThunkConfig & { rejectValue: AppError };

export const loadCachedPosts = createAsyncThunk<Post[], void, ThunkConfig>(
  'posts/loadCached',
  (_, { extra }) => extra.postRepository.readCache(),
);

export const refreshPosts = createAsyncThunk<Page, void, Rejectable>(
  'posts/refresh',
  async (_, { extra, rejectWithValue }) => {
    const result = await extra.postRepository.refresh();
    return result.ok ? result.data : rejectWithValue(toStateError(result.error));
  },
  // Pull-to-refresh spam sends one request (Bloc's droppable()).
  { condition: (_, { getState }) => !getState().posts.isRefreshing },
);

export const loadNextPage = createAsyncThunk<
  Page & { generation: number },
  { isRetry?: boolean } | void,
  Rejectable
>(
  'posts/loadNextPage',
  async (_, { extra, getState, rejectWithValue }) => {
    const { nextPage, generation } = getState().posts;
    const result = await extra.postRepository.loadPage(nextPage);
    return result.ok
      ? { ...result.data, generation }
      : rejectWithValue(toStateError(result.error));
  },
  {
    // The guards: one load at a time, never while refreshing, never past the
    // end, never before page 1 succeeded, and no auto-retry after an error.
    condition: (arg, { getState }) => {
      const s = getState().posts;
      const isRetry = !!arg && arg.isRetry === true;
      return !(
        s.isLoadingMore ||
        s.isRefreshing ||
        s.hasReachedEnd ||
        s.status !== 'success' ||
        (s.loadMoreError && !isRetry)
      );
    },
  },
);

/**
 * The component debounces the text and aborts the previous thunk when a new
 * query arrives (`promise.abort()`), which aborts the HTTP request through
 * `signal`. That is Bloc's debounce + switchMap / Rx's switchMap in Redux.
 */
export const searchPosts = createAsyncThunk<Post[], { query: string; force?: boolean }, Rejectable>(
  'posts/search',
  async ({ query }, { extra, signal, rejectWithValue }) => {
    const result = await extra.postRepository.search(query.trim(), signal);
    return result.ok ? result.data : rejectWithValue(toStateError(result.error));
  },
  {
    // distinctUntilChanged: "react" -> "reac" -> "react" sends no new request.
    condition: ({ query, force }, { getState }) => {
      const s = getState().posts;
      return !!force || !(query.trim() === s.query && s.searchStatus === 'success');
    },
  },
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    /** Clearing is instant and returns to the cached browse list. */
    searchCleared(state) {
      state.query = '';
      state.searchStatus = 'idle';
      state.searchResults = [];
      state.searchError = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCachedPosts.fulfilled, (state, { payload }) => {
        // Never overwrite fresher network data with the cache.
        if (state.items.length === 0 && payload.length > 0) {
          state.items = payload;
          state.status = 'success';
        }
      })
      .addCase(refreshPosts.pending, (state) => {
        state.isRefreshing = true;
        state.error = undefined;
        state.loadMoreError = undefined;
        state.generation += 1;
        if (state.items.length === 0) state.status = 'loading';
      })
      .addCase(refreshPosts.fulfilled, (state, { payload }) => {
        state.isRefreshing = false;
        state.status = 'success';
        state.items = payload.posts;
        state.nextPage = 2;
        state.hasReachedEnd = payload.endReached;
      })
      .addCase(refreshPosts.rejected, (state, { payload }) => {
        state.isRefreshing = false;
        state.error = payload ?? { kind: 'unknown' };
        state.status = state.items.length === 0 ? 'failure' : 'success';
      })
      .addCase(loadNextPage.pending, (state) => {
        state.isLoadingMore = true;
        state.loadMoreError = undefined;
      })
      .addCase(loadNextPage.fulfilled, (state, { payload }) => {
        state.isLoadingMore = false;
        if (payload.generation !== state.generation) return; // stale: a refresh happened
        // Dedupe by id: offset paging can shift items between pages.
        const seen = new Set(state.items.map((p) => p.id));
        state.items.push(...payload.posts.filter((p) => !seen.has(p.id)));
        state.nextPage += 1;
        state.hasReachedEnd = payload.endReached;
      })
      .addCase(loadNextPage.rejected, (state, { payload }) => {
        state.isLoadingMore = false;
        state.loadMoreError = payload ?? { kind: 'unknown' };
      })
      .addCase(searchPosts.pending, (state, { meta }) => {
        state.query = meta.arg.query.trim();
        state.searchStatus = 'loading';
        state.searchError = undefined;
      })
      .addCase(searchPosts.fulfilled, (state, { payload, meta }) => {
        if (meta.arg.query.trim() !== state.query) return; // belt and braces
        state.searchStatus = 'success';
        state.searchResults = payload;
      })
      .addCase(searchPosts.rejected, (state, { payload, meta }) => {
        if (meta.aborted || meta.arg.query.trim() !== state.query) return; // superseded
        state.searchStatus = 'failure';
        state.searchError = payload ?? { kind: 'unknown' };
      });
  },
});

export const { searchCleared } = postsSlice.actions;
export default postsSlice.reducer;
