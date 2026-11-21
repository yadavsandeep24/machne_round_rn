# JPMC / Barclays: refactor a data-fetching table (pair programming)

Built from `01-minimal`. Source: a candidate write-up of React pair-programming rounds at **JPMorgan Chase and Barclays** ([DEV](https://dev.to/aajinkya/coding-challenges-in-react-5bnn)). You get a working users table (list + per-row "Details") and are asked "how would you improve it?". This is the React Native version.

## Files
- `starter/DataTableStarter.tsx`: what the interviewer hands you, **bugs kept on purpose** and listed at the top of the file.
- `refactored/useRequest.ts`: reusable "latest request wins" hook (`useReducer`, `AbortController`, request id in a ref, abort on unmount).
- `refactored/DataTable.tsx`: the improved screen.
- The app has a toggle to switch between the two.

## The discussion points (in the order they usually come up)
| # | Problem in the starter | Refactor |
|---|---|---|
| 1 | `any` everywhere | `User`, `UsersApi` interfaces |
| 2 | Three `useState`s can contradict (loading + error) | One `RequestState` union via `useReducer` |
| 3 | **Race:** slow user-1 response overwrites user 2 | Abort the previous request **and** ignore responses whose id is not the latest |
| 4 | Responses land after leaving the screen | Abort in the effect cleanup on unmount |
| 5 | `fetch` does not reject on 404/500 | `if (!res.ok) throw` in `getJson` |
| 6 | Inline arrows per row defeat `memo` | One stable `useCallback`, memoised `UserRow` |
| 7 | Copy-pasted fetch logic in the component | `useRequest` hook + injected `UsersApi` (testable, reusable) |
| 8 | List disappears while reloading / on error | State keeps `previous` data |

**Why both abort and request id?** Abort saves bandwidth and work, but some APIs or libraries ignore the signal; the id check guarantees correctness either way.

**`useState` vs `useReducer`:** use a reducer when several values change together or the next state depends on the previous one; it also makes impossible states unrepresentable.

**In a real app:** TanStack Query (or RTK Query) gives you caching, dedupe, cancellation and retries; say so, then show you understand what it does underneath.

## Tests (11)
Race bug reproduced in the starter, fixed in the refactor (stale request aborted); unmount aborts; HTTP error shown while the list stays. Plus core tests and the app shell.

> Testing note: the race tests use short real delays. With Jest fake timers, an aborted promise inside RNTL 14's async `fireEvent` never settles and the test hangs.
