# Latest feature: `<Activity>` (React Native, React 19.2 / RN 0.83+, Oct–Dec 2025)

## What's new

`<Activity mode="visible" | "hidden">` is a React component that hides part of the UI **without unmounting it**.

When `mode="hidden"`:
- the children are hidden (on React Native the host view gets `display: 'none'`),
- React **cleans up their effects** (timers, subscriptions, polling stop),
- their **state is kept** (inputs, scroll, selections),
- updates inside them run at low priority, after visible work.

When it becomes `visible` again, React re-creates the effects with the saved state. You can also render something hidden ahead of time so it is ready when shown (pre-rendering).

Sources:
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2) — React blog, 1 Oct 2025 (introduces `<Activity>`).
- [`<Activity>` API reference](https://react.dev/reference/react/Activity) — react.dev.
- [React Native 0.83](https://reactnative.dev/blog/2025/12/10/react-native-0.83) — RN blog, 10 Dec 2025 (ships React 19.2, brings `Activity` and `useEffectEvent` to RN).

This repo already runs RN 0.88.1 with React 19.3.0, so no upgrade was needed.

## Why it matters

- Tabs, steppers and segmented controls are usually written as `{tab === 'card' && <CardForm />}`. Switching away **unmounts** the form, so the user's typed card number or pending UPI request is lost.
- The old fixes each have a cost: lift every field into Redux or a parent (lots of plumbing), or keep all panels mounted with `style={{ display: 'none' }}` (state is kept but effects keep running, so hidden screens still poll, animate and re-render).
- `<Activity>` gives "keep state, pause side effects" in one line.
- Use it for: tab panels, wizards with back/forward, a modal you open often, pre-rendering the likely next screen.
- Do not use it for: big lists of rarely visited screens (hidden trees still use memory), or data that must be shared or persisted (that belongs in a store). React Navigation tab/stack screens already keep screens mounted; use `<Activity>` inside a screen.

## Before vs after

```tsx
// Before: conditional rendering — state is destroyed on every switch
{selected === 'upi' && <UpiPanel />}
{selected === 'card' && <CardPanel />}

// Before (workaround): always mounted + display none — state kept, but effects keep running
<View style={{ display: selected === 'upi' ? 'flex' : 'none' }}><UpiPanel /></View>
```

```tsx
// After: React 19.2 <Activity> — state kept, effects paused while hidden
import { Activity } from 'react';

{METHODS.map(({ key }) => (
  <Activity key={key} mode={key === selected ? 'visible' : 'hidden'}>
    {panels[key]}
  </Activity>
))}
```

## How this branch uses it

A checkout screen with three payment-method tabs: UPI (sends a collect request and polls its status), Card (formatted number + Luhn check), Netbanking (bank picker).

- `src/features/checkout/MethodPanels.tsx` — the core: renders panels with `<Activity>` (after) or conditionally (before), chosen by a `strategy` prop.
- `src/features/checkout/panels.tsx` — `UpiPanel` (polling `useEffect` that is paused while hidden), `CardPanel`, `NetbankingPanel`.
- `src/features/checkout/CheckoutScreen.tsx` — amount header, accessible tab bar (`tablist` / `tab` roles), uses the Activity strategy.
- `src/features/checkout/upiApi.ts` — `UpiApi` interface, a fake that records calls, VPA validation.
- `src/features/checkout/cardFormat.ts` — card number grouping and Luhn check.
- `src/navigation/RootNavigator.tsx` — home route is now the checkout screen.
- `src/features/checkout/__tests__/MethodPanels.test.tsx` — before vs after: state kept vs lost, polling paused while hidden and resumed when shown.
- `src/features/checkout/__tests__/CheckoutScreen.test.tsx` — tab switching through the real UI, validation.
- `src/features/checkout/__tests__/cardFormat.test.ts` — pure helpers.

## Interview talking points

- "`<Activity>` separates *visibility* from *mounting*. Hidden means: keep state and views, run effect cleanups, and give updates low priority."
- "Effects are the key difference from `display: 'none'`. My UPI poller is a normal `useEffect` with cleanup. Hidden: the interval is cleared, no network calls. Visible again: the effect re-runs with the `requestId` still in state, so polling resumes where it was."
- "Because effects are cleaned up and re-run, every effect must have a correct cleanup. Activity makes missing cleanups visible, the same way Strict Mode does."
- "Hidden subtrees still cost memory. I use it for a few panels, not for 50 screens."
- "Testing: RNTL hides elements inside a hidden Activity from default queries; `includeHiddenElements: true` proves they are still mounted. Fake timers prove the polling pauses."
- "It is React, not React Native specific. RN got it in 0.83 when it moved to React 19.2."

**Likely follow-ups**

1. *How is this different from React Navigation keeping tab screens alive?* — Navigators keep whole screens mounted and give you focus events; effects keep running unless you use `useFocusEffect`. `<Activity>` works on any subtree and pauses effects automatically.
2. *What happens to a pending `fetch` when a panel is hidden?* — The effect cleanup runs. If you abort or ignore results in cleanup (as `UpiPanel` does with `cancelled`), the late result is dropped. Then the effect starts again when visible.
3. *Can I pre-render a screen the user will probably open next?* — Yes. Render it inside `<Activity mode="hidden">`. It renders at low priority without running effects, so it appears instantly when you switch it to visible.

## Gotchas and compatibility

- **Versions**: React 19.2+ and React Native 0.83+ (Expo SDK 55+). This repo: Expo SDK 58, RN 0.88.1, React 19.3.0.
- **Only two modes** today: `'visible'` and `'hidden'`.
- **Effects re-run** every time a panel becomes visible. Make effects idempotent and always return a cleanup.
- **Accessibility**: hidden children are not focusable by screen readers (the host view is `display: 'none'`).
- **Tests**: default RNTL queries skip hidden elements; pass `{ includeHiddenElements: true }` to assert they still exist.
- **Dependency bumps in this branch**: none.

## Run it

```bash
git checkout latest/2026-11-28-activity
npm install
npx tsc --noEmit
npx expo lint
npx jest
npx expo start
```
