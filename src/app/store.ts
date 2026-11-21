import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

import type { Services } from './services';

// Feature reducers are registered here.
const rootReducer = combineReducers({
  app: (state: { ready: boolean } = { ready: true }) => state,
});

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(services: Services, preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: services } }),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type ThunkConfig = { state: RootState; dispatch: AppDispatch; extra: Services };

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
