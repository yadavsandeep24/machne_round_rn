# Countdown timer → OTP verification with resend cooldown

Built from `01-minimal`. Source: a React Native interview reported on Glassdoor with "a machine coding question … a task of making a custom countdown timer" ([summary](https://www.glassdoor.ca/Interview/React-Native-and-React-Basic-concepts-a-machine-coding-question-using-graphs-a-task-of-making-a-custom-countdown-timer-an-QTN_7436095.htm); page not readable automatically). Built as the countdown you would actually ship in a fintech app: the OTP screen. Demo code: `123456`.

## What is built
- `useCountdown(deadline)`: counts down to an **absolute deadline**, re-computed every second and when the app returns to the foreground.
- 6-digit OTP input: one hidden `TextInput` behind six boxes; paste, iOS `oneTimeCode` and Android `sms-otp` autofill; non-digits stripped ("Your code is 123 456" works).
- Auto-submit at 6 digits, guarded so paste + autofill send **one** request.
- Resend cooldown (30 s), code expiry (5 min), resend limit (3), attempt limit (5) with lockout, friendly messages.
- Challenge persisted, so **killing the app does not reset the cooldown** (anti-abuse).
- Phone number masked; never logged.

## Points to make in the round
| Topic | Answer |
|---|---|
| Why not `setInterval(() => setSeconds(s => s - 1))`? | JS timers drift under load and pause in the background. A decrementing counter shows 0:20 after 25 s in the background; `deadline - now` is always right (tested). |
| Cleanup | `clearInterval` and `AppState` subscription removed in the effect cleanup. |
| Security | The server enforces cooldown, expiry and attempt limits; the client only mirrors them for UX. Rate-limit per phone and per device; never log the code or full number. |
| Autofill | iOS: `textContentType="oneTimeCode"`. Android: `autoComplete="sms-otp"`, or the SMS Retriever API (no SMS permission) via a native module for zero-tap. |
| Accessibility | Errors are an assertive live region; the timer is polite; one labelled input instead of six. |
| Native timers | For an exact background countdown (for example, a payment session), schedule a local notification or use a native timer; JS cannot run reliably while suspended. |

## Tests (13)
Masking; resend unlocks after 30 s; background jump of 25 s shows 0:05 immediately on return; messy paste auto-submits once and verifies; wrong code shows attempts left; killing the app keeps the cooldown. Plus core tests and the app shell.
