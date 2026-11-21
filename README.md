# Fintech: secure session (Keychain/Keystore tokens, single-flight refresh)

Built from `01-minimal`. Why: fintech React Native interview guides single out token storage, and **"store tokens in AsyncStorage" is called out as a common wrong answer** ([Trio RN hiring guide](https://trio.dev/react-native-hiring-guide/)). Security dominates fintech loops (your targets include Navi mobile security, NPCI, Mastercard). API: dummyjson auth (`/auth/login`, `/auth/refresh`, `/auth/me`; use the demo account in the [dummyjson auth docs](https://dummyjson.com/docs/auth)).

## What is built
- `createSecureTokenStore`: tokens in **`expo-secure-store`** (iOS Keychain / Android Keystore-backed), `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (not restored onto another device from a backup), in-memory copy for the interceptor.
- `installAuthInterceptor` on the authenticated axios instance: bearer header; on 401 one **single-flight** refresh shared by all parallel requests; the retried request is marked so it cannot loop; only 400/401/403 from refresh ends the session, a 5xx/network error keeps it.
- Refresh uses a **separate plain axios** instance, so it can never recurse into itself.
- React Navigation **auth-flow pattern**: screens are chosen by auth state (restoring → splash, signed out → Login, signed in → Profile); sign-out or an expired refresh swaps the stack and back cannot reach a protected screen.
- Login: validation, show/hide password, autofill hints (`username`, `current-password`), double-submit guard, one generic "Wrong username or password".

## Points to make in the round
| Question | Answer |
|---|---|
| Where do tokens go? | Keychain/Keystore (`expo-secure-store`, `react-native-keychain`). AsyncStorage is unencrypted files. MMKV can encrypt, but its key must itself come from the Keychain. |
| Access token lifetime? | Short (minutes), kept in memory; refresh token in secure storage, rotated on every refresh. |
| Refresh concurrency? | Share one in-flight promise; retry each request once (tested: 5 parallel 401s → 1 refresh). |
| When to log out? | Only when the refresh endpoint rejects the refresh token (tested), never on a network error. |
| Biometrics? | `expo-local-authentication` gate on app resume; or store the refresh token with `requireAuthentication` so the Keychain itself asks for Face ID. |
| More hardening | Certificate pinning for payment APIs, jailbreak/root signals, blur the app switcher snapshot, block screenshots on sensitive screens (Android `FLAG_SECURE`), no tokens or PII in logs/crash reports, Hermes bytecode is not obfuscation, so no secrets in the bundle. |

## Tests (13)
Interceptor (3): parallel 401s → one refresh, rejected refresh → cleared + expired callback, 5xx refresh keeps the session. Flow (4): validation, generic wrong-password message, sign in → profile with tokens in SecureStore and **nothing in AsyncStorage**, restore at launch and log out. Plus core tests.
