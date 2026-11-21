# Machine Round React Native: `02-posts-list`

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
