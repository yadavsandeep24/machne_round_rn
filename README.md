# SafeStreets: Dice Roller take-home (senior tier)

Built from `01-minimal`. Source: **SafeStreets' own public take-home** for mid-level and senior React Native engineers ([GitHub](https://github.com/SSDevelopment/takeHomeAssessment-reactNativeEngineer)). 4-hour hard cap, Expo starter with one die and a Roll button, submitted as a PR, then a code walkthrough interview. Seniors must finish tiers 1–3; tier 4 items impress.

| Tier | Requirement | Where |
|---|---|---|
| 1 | 1–20 dice, die type d4/d6/d8/d10/d12/d20, show each die and the sum | `domain/dice.ts`, `ui/DiceScreen.tsx` |
| 2 | History newest first: notation (`3d6`), dice, total, time; Clear | `ui/useDiceRoller.ts` |
| 3 | History survives restart; empty first launch handled | `data/historyStore.ts` |
| 4 | Modifiers (`3d6+2`), saved presets (long-press to remove), accessibility, tests | across the feature |

## Decisions to explain in the walkthrough
- **Pure domain module** (`dice.ts`): rolling, normalising and notation parsing have no React, so they are unit-tested directly. The RNG and clock are injected for deterministic tests.
- **Edge cases they grade:** 0 dice, 10,000 dice, NaN, an invalid die and a huge modifier are normalised (`normalize`); rapid taps are each a synchronous dispatch with a unique id (counter, not just the timestamp), so none is lost.
- **Persistence choice:** AsyncStorage JSON. History is small, append-only and read once at launch, so SQLite is overkill; MMKV would be the upgrade if it grew. Capped at 100 entries.
- **Load/save race:** saving starts only after the load finished, so the empty initial state can never overwrite saved history; a roll made while loading is merged, not lost.
- **Corrupt storage** falls back to an empty history instead of crashing.
- **Accessibility:** steppers are `adjustable` with increment/decrement actions (VoiceOver swipe up/down), die chips are a `radiogroup`, the result is a polite live region announcing dice and total, buttons have labels and disabled states.
- **Uniform randomness:** `floor(rng * sides) + 1` for `rng` in [0, 1). Mention `crypto.getRandomValues` if fairness mattered (for example, real-money games).

## Tests (16)
Domain (4): rolling + modifier, uniform coverage, normalised edge cases, notation round-trip. Screen (5): empty first launch, configure and roll 3d6+2, five rapid taps all recorded, history survives restart then clears, presets. Plus core tests and the app shell.
