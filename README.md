# Machine Round React Native: `01-minimal`

Core infrastructure with no features. Start a round from here when you can bring a skeleton.

```
App.tsx                         Provider + SafeAreaProvider + NavigationContainer; services injectable
src/
  app/services.ts               Services (http, store) = DI, passed to thunks as extraArgument
  app/store.ts                  makeStore(services), RootState, AppDispatch, typed hooks, ThunkConfig
  navigation/RootNavigator.tsx  typed native-stack navigator
  core/
    error/appError.ts           AppError discriminated union + userMessage()
    result.ts                   Result<T> = { ok: true, data } | { ok: false, error }
    network/http.ts             axios instance, safeCall(), mapError()
    storage/keyValueStore.ts    KeyValueStore (AsyncStorage + in-memory), readJson/writeJson
    hooks/useDebouncedValue.ts  debounce that is instant for a blank value
    ui/StateViews.tsx           LoadingView, ErrorView(retry), EmptyView, LoadMoreFooter, Button
ui/theme.ts                     colors, spacing
test/testServices.ts            fake services for tests
```

## Why these choices (be ready to defend them)
- **Redux Toolkit:** slices remove boilerplate, `createAsyncThunk` gives pending/fulfilled/rejected, `createSelector` memoises derived data, and the DevTools time-travel is a strong debugging story. (Zustand + TanStack Query is a fine alternative: say when you would pick it.)
- **DI through `thunk.extraArgument`:** thunks receive `{ http, store, …repositories }`. No module-level singletons, so tests just pass fakes to `makeStore`.
- **`AppError` union + `Result<T>`:** repositories never throw; components switch on `error.kind`, and TypeScript checks every case.
- **`KeyValueStore` interface:** AsyncStorage today; MMKV or SQLite later without touching features.
- **Store created in `useState(() => …)`:** once per app, not on every render.

## Testing notes
- RNTL 14 + React 19: `await render(...)`, `await renderHook(...)`.
- `jest.setup.ts` mocks AsyncStorage and safe-area insets; `transformIgnorePatterns` lets Jest compile the ESM builds of Redux, React Navigation and axios.

Next: `git checkout 02-posts-list`.
