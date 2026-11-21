# React Native coding rounds: research for this repo (checked 22 Nov 2026)

The problem branches are picked for **your profile**: SDE3 / mobile architect, about 15 years, FinTech payment SDKs (UPI intent, in-app checkout, native↔WebView) and EdTech, React Native SDK published on npm, targeting senior → principal mobile roles at fintechs (Payoneer, Mastercard, JPMorgan, NPCI, Navi, Adyen, LogiNext).

**No company publishes its coding questions.** Everything below is a candidate report, a company's own public take-home, or (marked) a domain problem chosen from fintech interview guides. LeetCode Discuss, Glassdoor and most Medium posts block automated reading (HTTP 403), so for those only search-result summaries were available; open them yourself before relying on details.

## What senior React Native rounds look like (patterns across sources)
- A **small feature with real-world edge cases**: debouncing, retries, offline handling, app lifecycle ([FrontendLead 2026 question bank](https://frontendlead.com/blog/react-native-interview-questions)).
- **Senior rounds add debugging**: the interviewer describes a production problem and watches how you investigate (same source). For seniors, the architecture/performance round is decisive and the task mainly confirms you still code ([Wisemonk hiring guide](https://www.wisemonk.io/blogs/a-comprehensive-guide-to-interviewing-react-native-developers)).
- **Fintech emphasis**: security dominates; "store tokens in AsyncStorage" is called out as a common wrong answer ([Trio RN hiring guide](https://trio.dev/react-native-hiring-guide/)); money precision, payment-state integrity and PCI scope come up ([Trio fintech React questions](https://trio.dev/what-to-ask-react-developer-fintech/)). Payment flows should treat the backend as the source of truth with explicit client states: initiated, awaiting authorisation, processing, succeeded, failed, unknown ([DEV RN handbook, part 4](https://dev.to/amitkumar13/react-native-interview-handbook-part-4-of-5-performance-architecture-3cjh)).

## Reports and public tasks used for branches

| Branch | Source | What was asked (paraphrased) |
|---|---|---|
| `jpmc/data-table-race-conditions` | [DEV: Coding challenges in React interviews for JPMC and Barclays](https://dev.to/aajinkya/coding-challenges-in-react-5bnn) (candidate write-up) | Pair programming on a data-fetching table (users list + per-row "Get details"). Improve it: types, one state vs several, race conditions, AbortController, request id in `useRef`, mounted/unmounted, reusable fetch, custom hook, `useState` vs `useReducer`, inline handlers. |
| `safestreets/dice-roller-takehome` | [SafeStreets public take-home](https://github.com/SSDevelopment/takeHomeAssessment-reactNativeEngineer) (company's own repo) | 4-hour Expo task, tiers by level. Senior must do tiers 1–3: configurable dice (1–6+, d4…d20) with sum, history newest-first with clear, persistence across restarts with an empty first launch; tier 4 stretch: animation, accessibility, tests, modifiers like `3d6+2`, presets. Graded on edge cases (0 dice, rapid taps), structure, data modelling, TypeScript, trade-offs. |
| `practice/otp-countdown-timer` | [Glassdoor: RN round with "a task of making a custom countdown timer"](https://www.glassdoor.ca/Interview/React-Native-and-React-Basic-concepts-a-machine-coding-question-using-graphs-a-task-of-making-a-custom-countdown-timer-an-QTN_7436095.htm) (summary only) | A custom countdown timer. Built here as the fintech version you would actually ship: OTP entry with resend cooldown that survives backgrounding. |
| `walmart/horizontal-list-component` | [Walmart Global Tech RN interview (Medium, Nov 2024)](https://medium.com/@poonkuzhali_98336/walmart-global-tech-interview-experience-cdc3509408ea) (summary only) | In an RN playground: build a simple UI component and a horizontal FlatList; questions on correct component usage and dependencies. |
| `fintech/payment-checkout-flow` | Domain problem from the fintech guides above + your resume (checkout, UPI intent) | Checkout with an explicit payment state machine, idempotency key, double-tap guard, status polling with backoff for "unknown", resume after backgrounding. |
| `fintech/transaction-history` | Domain problem (most common fintech list screen; also in your own Flutter lesson 11) | Transactions grouped by date with sticky headers, filters, search, cursor pagination, money in minor units. |
| `fintech/secure-session` | Fintech guides above (token storage) | Login with tokens in the Keychain/Keystore (`expo-secure-store`), session restore, single-flight token refresh, logout on rejected refresh only. |
| `practice/bugs-and-optimisation` | Senior "debugging round" pattern above | Top 10 React Native bugs and performance problems, each buggy vs fixed with a test. |

## Other signals (no branch)
- **Kotak Mahindra Bank (RN):** one 60-minute bar-raiser round on RN internals, architecture and memory management, then live UI component coding and DSA ([enginebogie](https://enginebogie.com/interview/experience/kotak-mahindra-bank-react-native-developer/1683), summary only).
- **FanCode (RN):** online assessment, a JavaScript polyfill round, a platform round on RN architecture and writing a native component, and system design ([Medium](https://medium.com/mighty-ghost-hack/interview-experience-with-fancode-for-a-react-native-developer-role-dca760fd781b), summary only).
- **Cars24 SDE1 RN:** machine coding round in CodeSandbox over Google Meet ([LeetCode Discuss](https://leetcode.com/discuss/post/4165763/cars24-sde1-react-native-bengaluru-rejected-in-round-3), summary only).
- **Dream11 RN SDE-2 (Mar–Apr 2025):** two LeetCode-style DSA problems in an hour, plus JavaScript and system design ([LeetCode Discuss](https://leetcode.com/discuss/post/6647765/dream11-react-native-sde-2-march-april-2-y83e/), summary only).
- **Q2Pay (RN, Jul 2025):** online RN assignment (UI and app structure), then hooks, promises, error handling, building an APK, ScrollView vs FlatList, state management ([DEV](https://dev.to/surajb/my-tech-interview-journey-at-q2pay-technology-react-native-developer-role-mc0)).
- **Not found:** first-hand React Native coding-round reports for PhonePe, Paytm, Groww, CRED, Razorpay, Navi, Payoneer, Adyen or Mastercard.

## Practical takeaway for you
1. Expect a 45–90 minute feature (or a 4-hour take-home) where edge cases and structure matter more than UI polish.
2. Expect a refactor/pair-programming round on a fetch component (`jpmc/*`) and a debugging round (`practice/bugs-and-optimisation`).
3. In fintech loops, volunteer the security and money-integrity points before you are asked (`fintech/*`).
4. Keep JavaScript fundamentals and polyfills (debounce, throttle, `Promise.all`) and 1–2 medium DSA problems warm: several loops still include them.
