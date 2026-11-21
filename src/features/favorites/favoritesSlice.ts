import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { RootState, ThunkConfig } from '../../app/store';
import { readJson, writeJson } from '../../core/storage/keyValueStore';

const KEY = 'favorite_ids_v1';

/** A record (not an array) gives O(1) lookups and cheap per-row selectors. */
export interface FavoritesState {
  ids: Record<number, true>;
}

export const loadFavorites = createAsyncThunk<number[], void, ThunkConfig>(
  'favorites/load',
  (_, { extra }) => readJson<number[]>(extra.store, KEY, []),
);

/** Optimistic: the reducer flips the id on `pending`; the thunk persists. */
export const toggleFavorite = createAsyncThunk<void, number, ThunkConfig>(
  'favorites/toggle',
  async (_, { extra, getState }) => {
    const ids = Object.keys(getState().favorites.ids).map(Number);
    await writeJson(extra.store, KEY, ids);
  },
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { ids: {} } as FavoritesState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadFavorites.fulfilled, (state, { payload }) => {
        for (const id of payload) state.ids[id] = true;
      })
      .addCase(toggleFavorite.pending, (state, { meta }) => {
        if (state.ids[meta.arg]) delete state.ids[meta.arg];
        else state.ids[meta.arg] = true;
      });
  },
});

export const selectIsFavorite = (state: RootState, id: number) => !!state.favorites.ids[id];
export const selectFavoriteCount = (state: RootState) => Object.keys(state.favorites.ids).length;

export default favoritesSlice.reducer;
