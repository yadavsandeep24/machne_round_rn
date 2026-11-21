# Machine Round React Native: `00-empty`

A blank Expo (SDK 58, React Native 0.88, React 19, TypeScript strict) app with every dependency already installed and Jest + React Native Testing Library working. This is what many interviewers hand you.

| Package | Why |
|---|---|
| `@reduxjs/toolkit`, `react-redux` | State: slices, thunks, memoised selectors |
| `@react-navigation/native`, `native-stack` | Navigation with typed params |
| `axios` | HTTP with interceptors and abort signals |
| `@react-native-async-storage/async-storage` | Local cache and session storage |
| `jest-expo`, `@testing-library/react-native` | Unit and component tests |

```bash
npm install
npm start            # Expo dev server (press a / i / w)
npm run check        # typecheck + lint + tests
```

Testing notes (RNTL 14 + React 19): `render` is async, so write `await render(<App />)`. `jest.setup.ts` mocks AsyncStorage and safe-area insets.

Next step: `git checkout 01-minimal`.
