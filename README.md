# Latest feature: `useEffectEvent` (React Native / React, React 19.2, 1 Oct 2025)

Branch: `latest/2026-11-27-use-effect-event` (built on `01-minimal`). Runs on this repo's React 19.3.0 and React Native 0.88.

## What's new

React 19.2 made `useEffectEvent` a stable hook. It lets you pull the "event" part out of an Effect. The function it returns:

- always sees the latest props and state, and
- is not a dependency, so changing it does not re-run the Effect.

`eslint-plugin-react-hooks` 6.1+ understands it: it stops asking you to add the callback to the dependency array, and it warns if you put the Effect Event itself in the array or call it from the wrong place. This repo has version 7.1.1 through `eslint-config-expo`.

Official sources:
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2) (react.dev blog, 1 Oct 2025)
- [`useEffectEvent` reference](https://react.dev/reference/react/useEffectEvent) (react.dev)
- [React 19.3](https://react.dev/blog/2026/09/09/react-19-3) (react.dev blog, 9 Sep 2026; the version this repo runs. Its headline features, `<ViewTransition>` and Fragment Refs, are web/DOM features, so this branch shows the 19.2 hook instead.)

## Why it matters

A common bug in mobile apps: an Effect runs a long-lived thing (polling, a socket, a timer, an `AppState` listener) and calls a callback from props when something happens. Then you have two bad choices:

1. **Put the callback in the deps.** Parents usually pass an inline function, so it changes every render. The Effect tears down and restarts on every render: the timer resets, extra requests go out, a socket reconnects.
2. **Leave it out of the deps.** The lint rule warns, and the Effect keeps the first callback forever (a stale closure). It reads old state.

`useEffectEvent` gives you the right behaviour directly: the Effect depends only on what should restart it (`paymentId`, `api`, `intervalMs`), and the callback always reads fresh values.

Use it for "something happened inside an Effect, now react with the latest values". Do not use it to hide real dependencies (if the Effect should restart when a value changes, keep it in the deps). Do not call an Effect Event during render or pass it to other components or hooks. Call it only from inside Effects.

## Before vs after

```tsx
// Before: the "latest ref" pattern
const onSettledRef = useRef(onSettled);
useLayoutEffect(() => {
  onSettledRef.current = onSettled;
});
useEffect(
  () => pollPaymentStatus({ api, paymentId, onSettled: (s) => onSettledRef.current(s), ... }),
  [api, paymentId, intervalMs],
);

// After (React 19.2+): useEffectEvent
const onSettledEvent = useEffectEvent((status: PaymentStatus) => onSettled(status));
useEffect(
  () => pollPaymentStatus({ api, paymentId, onSettled: (s) => onSettledEvent(s), ... }),
  [api, paymentId, intervalMs], // onSettledEvent is NOT listed, and the linter knows why
);
```

## How this branch uses it

The home screen is a "payment status" screen after checkout. It polls the payment until the bank confirms it. While waiting, the user can flip "Email me a receipt". When the payment settles, the screen uses the latest choice, and flipping the switch never restarts polling.

- `src/features/paymentStatus/usePaymentStatusPolling.ts`: the hook with `useEffectEvent` (new) and the latest-ref version (old), side by side.
- `src/features/paymentStatus/pollPaymentStatus.ts`: plain-JS poller; a `setTimeout` chain so requests never overlap, cancel on cleanup, `maxAttempts` timeout, keeps going on transient errors.
- `src/features/paymentStatus/paymentStatusApi.ts`: `PaymentStatusApi` interface, an axios version (`GET payments/:id` via `safeCall`) and a fake for the demo and tests.
- `src/features/paymentStatus/PaymentStatusScreen.tsx`: the screen; passes a new inline `onSettled` on every render on purpose.
- `src/app/ServicesContext.tsx`: lets screens read the same `Services` the Redux thunks get; `App.tsx` provides it.
- `src/app/services.ts`, `test/testServices.ts`: add `payments` to `Services`.
- `src/features/paymentStatus/__tests__/usePaymentStatusPolling.test.tsx`: runs the same 5 tests against the new and the old hook (no restart on re-render, latest callback called, paymentId change, errors and timeout, unmount).
- `src/features/paymentStatus/__tests__/PaymentStatusScreen.test.tsx`: flips the switch three times while waiting; still one request, and the receipt message uses the last value.

## Interview talking points

- "`useEffectEvent` separates *what restarts the Effect* from *what the Effect calls when something happens*. The first goes in deps; the second goes in an Effect Event."
- "Before 19.2 I used the latest-ref pattern. It works, but it is boilerplate, and it is easy to read the ref during render by mistake. Now there is one standard hook, and the linter checks how it is used."
- "In this poller, adding `onSettled` to deps would restart polling on every keystroke or toggle. Leaving it out would send the receipt based on the old toggle value. The Effect Event fixes both."
- "I poll with a `setTimeout` chain, not `setInterval`, so a slow request never overlaps the next one. Cleanup sets a `cancelled` flag, so a late response from an old payment cannot update the new one."
- "It is a hooks-level feature, so it works the same in React Native and on the web. It needs React 19.2 or later."
- "In production I would add backoff, stop polling when the app is in the background (`AppState`), and prefer a push or webhook result when the backend has one."

Likely follow-ups:
- **Why not just `useCallback` in the parent?** That only helps if every dependency of the callback is stable. Here it reads `emailReceipt`, so it changes when the toggle changes, and the Effect would restart anyway. It also depends on every caller doing it right.
- **Can I put the Effect Event in the deps array?** No. Its identity is not meant to be stable for deps, and the lint rule warns: "Functions returned from `useEffectEvent` must not be included in the dependency array."
- **Is the React Compiler a replacement?** No. The compiler memoizes values automatically, but a callback that reads changing state still changes. `useEffectEvent` is about Effect semantics, not memoization.

## Gotchas and compatibility

- Needs React 19.2+ (this repo: React 19.3.0, React Native 0.88.1, Expo SDK 58). On React 18 it existed only as `experimental_useEffectEvent` in experimental builds.
- Lint support needs `eslint-plugin-react-hooks` 6.1+ (here 7.1.1 via `eslint-config-expo`).
- Call Effect Events only from Effects (or other Effect Events). Do not call them during render, and do not pass them as props or to other hooks.
- Tests: RNTL 14's `render`, `rerender` and `fireEvent` are async; always `await` them. With fake timers, use `jest.advanceTimersByTimeAsync` inside `act` so promise callbacks run.
- No dependency bumps in this branch.

## Run it

```bash
git checkout latest/2026-11-27-use-effect-event
npm install
npx tsc --noEmit
npx expo lint
npx jest
npx expo start
```
