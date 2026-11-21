# Machine Round React Native

A starter project for **React Native machine coding rounds**: Expo SDK 58 (React Native 0.88, React 19), TypeScript strict, Redux Toolkit, React Navigation, axios, AsyncStorage, offline-first caching, manual pagination, debounced search with cancellation, and Jest + React Native Testing Library. It is the React Native counterpart of the Android and Flutter starters.

The sample feature fetches posts from `jsonplaceholder.typicode.com`, caches them, and supports pagination, debounced server-side search, pull-to-refresh, favorites shared across screens, loading/error/empty states, and a detail screen with comments.

## Branches

**Step ladder.** Each branch builds on the previous one, so `git diff <prev>..<next>` shows exactly one feature:

| Branch | What it adds |
|---|---|
| `00-empty` | Expo TS app, all dependencies, ESLint, Jest + RNTL working |
| `01-minimal` | `AppError` union, `Result<T>`, `safeCall`, `KeyValueStore`, Redux store with DI via thunk `extraArgument`, shared state views, typed navigation |
| `02-posts-list` | Offline-first list with Redux Toolkit: cache then network, loading/error/empty, pull-to-refresh, dropped duplicate refreshes |
| `feature/post-detail` | Typed route params, local async hook with `AbortController`, parallel comments, network fallback |
| `feature/pagination-manual` | `onEndReached` load-more with thunk `condition` guards, footer states, stale-page guard |
| `feature/search-debounce` | Debounced search; the effect cleanup aborts the previous thunk (switchMap), distinct, retry |
| `main` | Everything above + persisted favorites with per-row selectors, docs |

**Problem branches** (each from `01-minimal`), chosen from **reported React Native rounds and fintech interview guides for your profile** (senior mobile, payments). Sources and caveats: [docs/INTERVIEW_RESEARCH.md](docs/INTERVIEW_RESEARCH.md).

| Branch | Source | Problem |
|---|---|---|
| `jpmc/data-table-race-conditions` | JPMC/Barclays pair-programming report | Improve a data-fetching table: types, `useReducer`, race conditions (`AbortController` + request id), unmount, custom hook. Starter vs refactor with race tests. |
| `safestreets/dice-roller-takehome` | SafeStreets' public senior take-home | Configurable dice, history newest first, persistence across restarts, modifiers, presets, accessibility, tests |
| `practice/otp-countdown-timer` | Glassdoor "custom countdown timer" task | Deadline-based countdown, OTP input with autofill, resend cooldown that survives background and app kill |
| `walmart/horizontal-list-component` | Walmart RN playground task | Memoised product card + snapping horizontal FlatList with viewability dots |
| `fintech/payment-checkout-flow` | Fintech guides + your checkout/UPI background | Payment state machine, idempotency key, double-tap guard, polling with backoff (timeout = unknown, never failed), UPI return, relaunch recovery |
| `fintech/transaction-history` | Fintech domain | Day-grouped SectionList, server filters, debounced search, cursor pagination with abort, money in minor units |
| `fintech/secure-session` | Fintech guides (token storage) | Tokens in Keychain/Keystore (`expo-secure-store`), single-flight refresh interceptor, auth-flow navigation |
| `practice/bugs-and-optimisation` | Senior debugging-round pattern | Top 10 React Native bugs and performance problems, Buggy vs Fixed with proving tests |

```bash
git checkout 02-posts-list && git checkout -b my-attempt
git diff 02-posts-list..feature/post-detail
```

## Architecture
```
UI (screens, memoised rows)  ──dispatch──►  thunks (createAsyncThunk)  ──►  repositories  ──►  axios / AsyncStorage
        ▲ useAppSelector                        │ extra = Services (DI)          │ Result<T>, AppError
        └──────────── slices (state) ◄──────────┘
hooks (useServices) for screen-local async state, e.g. the detail screen
```
- **Dependency rule:** UI → state → data. Components never import axios; repositories return `Result<T>` with a typed `AppError`.
- **DI:** `makeStore(services)` passes services as the thunk `extraArgument`; `ServicesProvider` gives the same services to hooks. Tests pass fakes.
- **Offline-first:** the cache renders first; the network replaces it and writes it back.

## Redux vs local state (both are in the project)
| | Redux slice (`postsSlice`) | Local hook (`usePostDetail`) |
|---|---|---|
| Use it when | Shared, cached, or needed across screens | Screen-local, short-lived |
| Concurrency | Thunk `condition` (drop duplicates), `promise.abort()` (cancel), generation counter (stale pages) | `AbortController` in the effect cleanup |
| Errors | Serialisable `AppError` in state | `AppError` in local state |

## Things interviewers look for (already handled)
- Loading, error with Retry, empty and success states; cached data kept on network failure
- `FlatList` done right: stable `keyExtractor`, `getItemLayout`, memoised `renderItem` and rows, empty state inside the list
- Stable callbacks (`useCallback`) so `memo` works; narrow selectors so a like doesn't re-render the list
- Cancellation everywhere (`AbortController`, thunk abort); no state updates after unmount
- Typed navigation params; data passed by id with a fetch fallback
- Tests through the real `App` with fake services, plus slice and hook tests

## Testing notes (React Native Testing Library 14 + React 19)
- `render`, `renderHook` and `fireEvent` are **async**: always `await` them, or effects run outside `act` and fake timers appear to do nothing.
- Don't run two `fireEvent`s concurrently (`Promise.all`): overlapping `act` scopes break later tests. Test same-frame double taps at the hook level.
- An aborted promise inside an awaited `fireEvent` can hang under Jest fake timers; use short real delays for abort/race tests.
- `jest.setup.ts` mocks AsyncStorage and safe-area insets; `transformIgnorePatterns` lets Jest compile the ESM builds of Redux, React Navigation and axios.

## Run
```bash
npm install
npm start           # Expo dev server: a = Android, i = iOS, w = web
npm run check       # typecheck + lint + tests
```
