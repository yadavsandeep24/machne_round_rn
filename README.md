# Fintech: transaction history

Built from `01-minimal`. A **domain problem**: the most common list screen in any payments or banking app, and the same task as lesson 11 in your Flutter prep. Fintech guides also probe money precision and real-time list performance ([Trio](https://trio.dev/what-to-ask-react-developer-fintech/)). Aim for 60–90 minutes.

## What is built
- `SectionList` grouped by **local** calendar day ("Today", "Yesterday", "3 Nov", "31 Dec 2025") with sticky headers and a per-day net (successful transactions only).
- Server-side filters: Received / Paid, Pending / Failed, and debounced search on name or note.
- **Cursor pagination** (`nextCursor`), footer spinner / error + Retry, pull-to-refresh.
- Signed INR amounts from integer paise (`+₹1,250.00`, `−₹250.50`), tabular digits, failed amounts struck through, pending/failed badges.
- One accessibility label per row: "Paid to Swiggy, −₹250.00, 10:30, failed".

## Points to make in the round
| Topic | Answer |
|---|---|
| Cursor vs page number | New transactions arrive at the top; offset paging then repeats or skips rows. A cursor (last id / timestamp) stays correct. Dedupe by id anyway. |
| Filter change | A new query: reset, **abort** the in-flight first page or load-more for the old filter, start again (tested). |
| Timezones | The server sends UTC; group by the user's local day (`dayKey`), otherwise late-night payments land under the wrong date. |
| Money | Integer minor units, `Intl.NumberFormat('en-IN')` for lakh/crore grouping; never sum floats. |
| Derived data | `groupByDay` runs in `useMemo` on the item list, not on every render; rows and headers are memoised. |
| Big lists | `initialNumToRender`, `getItemLayout` needs fixed heights (headers make it harder); FlashList for thousands of rows. |
| Real time | New transactions via push/WebSocket: prepend with dedupe and keep the scroll position (`maintainVisibleContentPosition`). |
| Offline | Cache the first page (MMKV/SQLite) for an instant start; label it "Last updated …". |
| Privacy | Mask account numbers/VPAs; respect a "hide balances" setting; no PII in analytics. |

## Tests (15)
Domain (3): Today/Yesterday/dates grouping in order, net counts only successes, signed INR formatting. Screen (5): grouping + cursor pages to the end, filter change aborts and restarts, server-side search + empty state, first-page error + Retry, row accessibility label. Plus core tests and the app shell.
