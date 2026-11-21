import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { ThunkConfig } from '../../../app/store';
import type { AppError } from '../../../core/error/appError';
import { toStateError } from '../../../core/error/serializable';
import type { Post } from '../domain/post';

export type Status = 'loading' | 'success' | 'failure';

export interface PostsState {
  status: Status;
  items: Post[];
  isRefreshing: boolean;
  /** Full-screen when items is empty, otherwise a banner over cached data. */
  error?: AppError;
}

const initialState: PostsState = { status: 'loading', items: [], isRefreshing: false };

export const loadCachedPosts = createAsyncThunk<Post[], void, ThunkConfig>(
  'posts/loadCached',
  (_, { extra }) => extra.postRepository.readCache(),
);

export const refreshPosts = createAsyncThunk<Post[], void, ThunkConfig & { rejectValue: AppError }>(
  'posts/refresh',
  async (_, { extra, rejectWithValue }) => {
    const result = await extra.postRepository.refresh();
    return result.ok ? result.data : rejectWithValue(toStateError(result.error));
  },
  // Pull-to-refresh spam sends one request (Bloc's droppable()).
  { condition: (_, { getState }) => !getState().posts.isRefreshing },
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
        if (state.items.length === 0) state.status = 'loading';
      })
      .addCase(refreshPosts.fulfilled, (state, { payload }) => {
        state.isRefreshing = false;
        state.status = 'success';
        state.items = payload;
      })
      .addCase(refreshPosts.rejected, (state, { payload }) => {
        state.isRefreshing = false;
        state.error = payload ?? { kind: 'unknown' };
        state.status = state.items.length === 0 ? 'failure' : 'success';
      });
  },
});

export default postsSlice.reducer;
