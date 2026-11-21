# Fintech: payment checkout flow (state machine, idempotency, polling)

Built from `01-minimal`. A **domain problem**: no candidate report names this exact task, but fintech interview guides say payment flows must treat the backend as the source of truth with explicit client states ([DEV RN handbook, part 4](https://dev.to/amitkumar13/react-native-interview-handbook-part-4-of-5-performance-architecture-3cjh)) and probe money precision and payment integrity ([Trio](https://trio.dev/what-to-ask-react-developer-fintech/)). It is also the core of your resume (in-app checkout, UPI intent). Expect it as a machine-coding task or as the "design + code a piece" part of a senior fintech loop.

## The state machine (`domain/paymentMachine.ts`, pure and unit-tested)
```
idle ──PAY──► initiating ──CREATED(url)──► awaitingAuthorization ──AUTH_RETURNED──► processing
                 │        └─CREATED──────────────────────────────────────────────►   │
                 └─CREATE_FAILED──► failed ◄──STATUS(failed)───────────────────────────┤
                                     │ RESET ► idle                                    ├─STATUS(succeeded)─► succeeded (final)
                                                                    TIMED_OUT ─► unknown ─STATUS(succeeded)─┘
```
Illegal events are ignored (a second `PAY` while initiating, anything after `succeeded`).

## The rules it enforces
| Rule | Why | Where |
|---|---|---|
| **Timeout = UNKNOWN, never FAILED** | "Failed" for a payment that went through makes users pay twice | `TIMED_OUT` → `unknown`, UI says "You will not be charged twice", Check status button |
| **Idempotency key per attempt** | A lost `create` response is retried with the **same** key, so the server returns the same payment | `usePayment.pay`; tested: two calls, one payment |
| **New key only after a definite failure** | A declined card is a new attempt | tested: `key_1`, then `key_2` |
| **Double tap** | Second tap in the same frame is ignored before React re-renders | `stateRef` guard + machine; tested at hook level |
| **Polling with backoff** | 1, 2, 4, 8, 15, 30 s (about 60 s), network errors while polling are not failures | `poll()` |
| **UPI intent / 3DS** | Open the app with `Linking.openURL`; resume status checks when `AppState` becomes `active` | tested |
| **App killed mid-payment** | In-flight payment saved; relaunch re-checks it | tested |
| **Money** | Integer minor units, `Intl.NumberFormat` (`₹588.82`), currency-mismatch guard | `domain/money.ts` |
| **PCI scope** | Card entry stays inside the gateway's SDK / hosted fields; the app never sees the PAN | UI copy |

## What to say about the real system
- The server also confirms via **webhook**; polling is the client's view. The final truth is the server's order status.
- Never log card data, UPI VPA or tokens; mask in analytics.
- UPI: use the PSP SDK or intent with a server-generated transaction reference; verify the status on the server, never trust the UPI app's return payload alone.

## Tests (18)
Machine (5): happy path, double PAY ignored, timeout → unknown then late success, success is final, money. Screen/hook (6): UPI flow with app return, double tap → one payment, lost response → same key and one payment, polling budget → unknown → Check status, decline → new key, relaunch re-checks a saved payment. Plus core tests and the app shell.
