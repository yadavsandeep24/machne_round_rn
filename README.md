# Machine Round React Native: `feature/search-debounce`

> Diff against the previous step: `git diff feature/pagination-manual..feature/search-debounce`

## This step: server-side search with debounce and cancellation
```
keystroke ─► useState(text)           (input owns its text: typing never lags)
          ─► useDebouncedValue(300ms)  (blank is instant)
          ─► useEffect([query]):
               const req = dispatch(searchPosts({ query }))
               return () => req.abort()   ◄── next query / unmount aborts the HTTP request
          thunk condition: skip if the same query already succeeded (distinct)
```
- **Why abort:** without it, a slow response for "re" can land after "react" and overwrite it (Rx/Bloc `switchMap`). The thunk passes its `signal` to axios; the reducer ignores `meta.aborted` rejections. Tested.
- **Retry** dispatches the same query with `force: true`.
- **Clearing** dispatches `searchCleared()` immediately and returns to the cached list.
- **Results are not cached**; old results stay visible under a spinner while a new query loads.
- **Local filtering instead?** Keep the debounce and filter `items` with a memoised selector.
- **Testing gotcha:** RNTL 14 `fireEvent` is async: always `await fireEvent.changeText(...)`, otherwise the effects run outside `act` and fake timers seem to do nothing.
- Tests: 4 slice tests (trimmed query, abort keeps newer results, distinct + force, error + clear) and 1 screen test (debounce into one request, empty result, clear). 28 total.

---

## Earlier step: `feature/pagination-manual`

> Diff against the previous step: `git diff feature/post-detail..feature/pagination-manual`

## This step: hand-written load-more
- **Trigger:** `FlatList` `onEndReached` with `onEndReachedThreshold={0.5}` (half a screen before the end).
- **Guards in the thunk `condition`:** one load at a time, never while refreshing, never past the end, never before page 1 succeeded, and no automatic retry after an error (footer Retry passes `{ isRetry: true }`). `onEndReached` fires often; the guards make it harmless (tested with 3 concurrent dispatches → 1 request).
- **Footer:** `LoadMoreFooter` spinner or error + Retry; hidden at the end.
- **Refresh vs in-flight load-more:** every refresh bumps `generation`; a page that started under an older generation is dropped instead of being appended onto the new page 1 (tested with a gate).
- **Dedupe by id** when appending. **Only page 1 is cached** for an instant, offline start.
- **End of data:** a short page. Use `hasMore` / `total` / `nextCursor` if the API gives one.
- Tests: 4 pagination tests. 23 total.

---

## Earlier step: `feature/post-detail`

> Diff against the previous step: `git diff 02-posts-list..feature/post-detail`

## This step: detail screen with a local async hook
- **Typed route params:** `PostDetail: { id: number }` in `RootStackParamList`; `NativeStackScreenProps` types `route.params`.
- **Not everything belongs in Redux:** the detail screen uses `usePostDetail(id)` with local state. Contrast it with the posts slice when asked "when do you NOT use Redux?" (screen-local, not shared, not cached across screens).
- **`AbortController` in `useEffect` cleanup:** leaving the screen or changing the id aborts the requests, so no state update lands on an unmounted screen and an old post never replaces a newer one (tested).
- **Parallel requests:** `Promise.all` for post + comments. A comments failure shows inline and does not fail the screen.
- **Cache first, network fallback** in `PostRepository.getPost` for posts that were never cached.
- **`ServicesProvider` + `useServices()`:** hooks get the same services that thunks get as `extraArgument`.
- **Stable `onPress`:** the list passes one `useCallback` to memoised rows, so opening a post does not re-render every row.
- Tests: 5 more (open detail, comments failure, network fallback, not found, abort on id change). 19 total.

---

## Earlier step: `02-posts-list`

A basic feature on top of `01-minimal`: fetch posts from `jsonplaceholder.typicode.com`, cache them in AsyncStorage (offline-first), and show loading, error with Retry, empty and success states with pull-to-refresh. State: **Redux Toolkit**.

```
features/posts/
  domain/post.ts             Post + parsePost (validates untrusted JSON)
  data/postApi.ts            fetchPosts (axios, AbortSignal-ready)
  data/postRepository.ts     PostRepository: readCache(), refresh() -> Result
  state/postsSlice.ts        loadCachedPosts, refreshPosts thunks; status/items/isRefreshing/error
  ui/PostsScreen.tsx         FlatList + RefreshControl + state views
  ui/PostRow.tsx             memoised row with a fixed height
```

## Data flow
```
mount ─► loadCachedPosts()  ─► cached items shown at once (status success)
      └► refreshPosts()     ─► repo.refresh() ─► API ─► cache written ─► items replaced
```
- **Offline-first:** an error with cached data shows a banner over the list; with no cache, the full-screen error + Retry.
- **Race:** a slow cache read never overwrites fresher network data (tested).
- **`condition` on the thunk:** pull-to-refresh spam makes one request (tested), like Bloc's `droppable()`.
- **Serialisable state:** errors are stored without the raw `cause` (`toStateError`).
- **FlatList basics:** stable `keyExtractor`, `getItemLayout` (fixed row height), memoised `renderItem` and row, empty state inside the list so pull-to-refresh still works.

## Tests (14)
`safeCall`/`mapError` (5), debounce hook (1), slice (5: success, empty-cache failure, cached-data failure, cache-vs-network race, dropped duplicate refresh), screen through the real `App` (3: data, error + Retry, empty).

## Branch ladder
`02-posts-list` → `feature/post-detail` → `feature/pagination-manual` → `feature/search-debounce` → `main`. `git diff <prev>..<next>` shows exactly one feature.