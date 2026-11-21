# Bugs and optimisation: top 10 React Native "fix this code" questions

Built from `01-minimal`. Senior React Native rounds add a **debugging scenario**: the interviewer describes a production problem and watches how you investigate ([FrontendLead 2026](https://frontendlead.com/blog/react-native-interview-questions)); pair-programming rounds like JPMC's are mostly "improve this component" ([DEV](https://dev.to/aajinkya/coding-challenges-in-react-5bnn)). These are the 10 that come up most in React Native, each runnable as Buggy vs Fixed with a test that proves both.

## How to practise
1. `npm start`. The home screen lists the 10. Each opens on **Buggy**: read the symptom, reproduce, say the cause out loud, then **Show answer**.
2. Fix `src/challenges/cNN_*/buggy.tsx` yourself without opening `fixed.tsx`.
3. Run its test, e.g. `npx jest src/challenges/__tests__/c04`. Buggy tests assert the broken behaviour, so update them after your fix.

## The 10
| # | Type | Symptom | Root cause | Fix | Test proves |
|---|---|---|---|---|---|
| 1 | Bug | Timer stuck at 1 | Stale closure in `setInterval` | Functional update | 1 s vs 5 s after 5 s |
| 2 | Bug | Handler fires many times, leaks | Effect with no deps and no cleanup | `[]` + `sub.remove()`, callback in a ref | 4 listeners and still alive after unmount vs 1 then 0 |
| 3 | Bug | API called again and again | New object in effect deps | Primitive deps / `useMemo` | ≥5 calls vs 1 |
| 4 | Bug | Cart count doesn't update | `push` + set same array | `setItems(p => [...p, x])` | 0 vs 3 |
| 5 | Bug | Check jumps to another row after delete | Index keys | Stable id in `keyExtractor` | B→C vs B stays |
| 6 | Bug | Old user still shown after switching | Props copied into `useState` | Derive, or `key={id}` | Ada vs Grace |
| 7 | Bug | "VirtualizedLists should never be nested…" | FlatList inside a same-direction ScrollView | `ListHeaderComponent` / SectionList | Nested scroller vs one |
| 8 | Perf | One tap re-renders every memoised row | New function/style props each render | `useCallback`, `StyleSheet`, memoised `renderItem`, `extraData` | Many rows vs 1 |
| 9 | Perf | Cart change re-renders unrelated UI | One context, new value object | Split contexts, `useMemo` value, `memo` consumers (or selectors) | Theme re-renders 3× vs 0× |
| 10 | Perf | Long list slow to open | `ScrollView` + `map` | `FlatList` + `getItemLayout` (FlashList for huge lists) | 2000 mounts vs < 100 |

## Say this too (prevention)
- **Lint:** `react-hooks/exhaustive-deps` catches 1 and 3; the React Compiler rules in `eslint-config-expo` flag reading refs during render and mutating values. This repo runs them (`npm run lint`).
- **Measure, don't guess:** React DevTools Profiler ("Highlight updates"), the Perf Monitor (JS vs UI thread FPS), Flipper/React Native DevTools, and a release build on a low-end Android device.
- **Tests:** render counters turn "I optimised it" into evidence (8, 9, 10).

## Bonus one-liners
- `console.log` in production slows the JS thread: strip with `babel-plugin-transform-remove-console`.
- `Animated` without `useNativeDriver: true` (or Reanimated worklets) janks when JS is busy.
- Heavy work on press blocks the transition: `InteractionManager.runAfterInteractions` or move it off the JS thread.
- Large remote images: size them, cache them (`expo-image`), never full-resolution thumbnails.
- `Image`/`Text` inside lists without fixed sizes cause layout jumps; give rows a fixed height when you can.
- Inline `{{}}` styles are fine once; inside a list they allocate per row per render.
- `setState` after unmount on fetch: abort in the cleanup (see `jpmc/data-table-race-conditions`).
- A `Promise` started in an effect for an old prop can land after the new one: abort or ignore stale results.

## Tests (27)
Two per challenge (buggy and fixed), plus core tests and the gallery.

> Testing notes: React Native's nested-list warning needs a real ScrollView context, which Jest's mock does not provide, so test 7 checks the tree structure instead.
