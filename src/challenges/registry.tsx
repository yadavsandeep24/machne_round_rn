import type { ReactElement } from 'react';

import { TimerBuggy } from './c01_stale_closure/buggy';
import { TimerFixed } from './c01_stale_closure/fixed';
import { KeyboardWatcherBuggy } from './c02_listener_leak/buggy';
import { KeyboardWatcherFixed } from './c02_listener_leak/fixed';
import { SearchBuggy } from './c03_effect_loop/buggy';
import { SearchFixed } from './c03_effect_loop/fixed';
import { CartBuggy } from './c04_mutated_state/buggy';
import { CartFixed } from './c04_mutated_state/fixed';
import { TasksBuggy } from './c05_index_keys/buggy';
import { TasksFixed } from './c05_index_keys/fixed';
import { GreetingBuggy } from './c06_state_from_props/buggy';
import { GreetingFixed } from './c06_state_from_props/fixed';
import { FeedBuggy } from './c07_nested_lists/buggy';
import { FeedFixed } from './c07_nested_lists/fixed';
import { UsersBuggy } from './c08_inline_props_memo/buggy';
import { UsersFixed } from './c08_inline_props_memo/fixed';
import { AppBuggy } from './c09_context_rerenders/buggy';
import { AppFixed } from './c09_context_rerenders/fixed';
import { LeaderboardBuggy } from './c10_scrollview_map/buggy';
import { LeaderboardFixed } from './c10_scrollview_map/fixed';
import { ApiCallsDemo, KeyboardDemo, SwitchUserDemo } from './demos';

export interface Challenge {
  id: number;
  kind: 'bug' | 'perf';
  title: string;
  symptom: string;
  tryIt: string;
  cause: string;
  fix: string;
  buggy: () => ReactElement;
  fixed: () => ReactElement;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 1, kind: 'bug', title: 'Stale closure in setInterval',
    symptom: 'Timer shows 1 and never moves.', tryIt: 'Wait a few seconds.',
    cause: 'The interval callback captured `seconds` from the first render.',
    fix: 'Functional update `setSeconds(s => s + 1)`; or a ref for values read in long-lived callbacks.',
    buggy: () => <TimerBuggy />, fixed: () => <TimerFixed />,
  },
  {
    id: 2, kind: 'bug', title: 'Listener added every render, never removed',
    symptom: 'Keyboard handler fires many times; memory grows; fires after leaving the screen.',
    tryIt: 'Tap Re-render 3 times, then open the keyboard.',
    cause: 'useEffect with no deps and no cleanup subscribes on every render.',
    fix: 'Subscribe once (`[]`), return `() => sub.remove()`, keep the latest callback in a ref.',
    buggy: () => <KeyboardDemo Watcher={KeyboardWatcherBuggy} />, fixed: () => <KeyboardDemo Watcher={KeyboardWatcherFixed} />,
  },
  {
    id: 3, kind: 'bug', title: 'Object in effect deps → request loop',
    symptom: 'Screen calls the API again and again.', tryIt: 'Watch the API call counter.',
    cause: 'A new `{}` each render is a new dependency each render.',
    fix: 'Depend on primitives or useMemo the object; keep fetchers stable with useCallback.',
    buggy: () => <ApiCallsDemo Search={SearchBuggy} />, fixed: () => <ApiCallsDemo Search={SearchFixed} />,
  },
  {
    id: 4, kind: 'bug', title: 'Mutating state in place',
    symptom: 'Cart count does not update after tapping Add.', tryIt: 'Tap Add three times.',
    cause: 'push + setItems(sameArray): Object.is says nothing changed, so no render.',
    fix: 'New array: `setItems(prev => [...prev, x])`.',
    buggy: () => <CartBuggy />, fixed: () => <CartFixed />,
  },
  {
    id: 5, kind: 'bug', title: 'Index as key in a dynamic list',
    symptom: 'Checked state jumps to another row after deleting.', tryIt: 'Check Task B, delete Task A.',
    cause: 'Index keys move row state to whichever item now has that index.',
    fix: 'keyExtractor returns a stable id from the data.',
    buggy: () => <TasksBuggy />, fixed: () => <TasksFixed />,
  },
  {
    id: 6, kind: 'bug', title: 'Props copied into state',
    symptom: 'Header still shows the old user after switching account.', tryIt: 'Tap Switch account.',
    cause: 'useState(initial) reads the prop only on mount.',
    fix: 'Derive during render; or reset with `key={user.id}`.',
    buggy: () => <SwitchUserDemo Greeting={GreetingBuggy} />, fixed: () => <SwitchUserDemo Greeting={GreetingFixed} />,
  },
  {
    id: 7, kind: 'bug', title: 'FlatList inside a ScrollView',
    symptom: '"VirtualizedLists should never be nested…" warning; slow, all rows rendered.',
    tryIt: 'Open it and watch the console.',
    cause: 'The outer ScrollView gives the list infinite height, so it renders everything.',
    fix: 'One scroller: ListHeaderComponent / ListFooterComponent or SectionList.',
    buggy: () => <FeedBuggy />, fixed: () => <FeedFixed />,
  },
  {
    id: 8, kind: 'perf', title: 'Inline props defeat React.memo',
    symptom: 'One tap re-renders every row although rows are memoised.',
    tryIt: 'Tap users; enable "Highlight updates" in React DevTools.',
    cause: 'New function and style object per render fail memo’s shallow compare.',
    fix: 'useCallback, StyleSheet.create, memoised renderItem, extraData.',
    buggy: () => <UsersBuggy />, fixed: () => <UsersFixed />,
  },
  {
    id: 9, kind: 'perf', title: 'One big context with a new value each render',
    symptom: 'Adding to cart re-renders unrelated parts of the app.', tryIt: 'Tap Cart a few times.',
    cause: 'Every consumer re-renders when the (new) context value changes.',
    fix: 'Split contexts, useMemo the value, memo consumers; or a store with selectors.',
    buggy: () => <AppBuggy />, fixed: () => <AppFixed />,
  },
  {
    id: 10, kind: 'perf', title: 'ScrollView + map for a long list',
    symptom: '2000-row leaderboard takes seconds to open and uses lots of memory.', tryIt: 'Open both and compare.',
    cause: 'ScrollView mounts every row up front.',
    fix: 'FlatList (virtualised) with getItemLayout; FlashList for very large lists.',
    buggy: () => <LeaderboardBuggy />, fixed: () => <LeaderboardFixed />,
  },
];
