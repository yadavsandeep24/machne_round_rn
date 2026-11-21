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
}

const initialState: PostsState = {
  status: 'loading',
  items: [],
  isRefreshing: false,
  nextPage: 2,
  isLoadingMore: false,
  hasReachedEnd: false,
  generation: 0,
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

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
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
      });
  },
});

export default postsSlice.reducer;
