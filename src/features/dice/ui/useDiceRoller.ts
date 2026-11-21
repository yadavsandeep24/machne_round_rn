import { useCallback, useEffect, useReducer, useRef } from 'react';

import { HISTORY_LIMIT, type DiceStorage } from '../data/historyStore';
import { formatNotation, normalize, rollDice, type RollConfig, type RollResult, type Rng } from '../domain/dice';

interface State {
  loaded: boolean;
  config: RollConfig;
  history: RollResult[]; // newest first
  presets: RollConfig[];
}

type Action =
  | { type: 'loaded'; history: RollResult[]; presets: RollConfig[] }
  | { type: 'configChanged'; config: RollConfig }
  | { type: 'rolled'; result: RollResult }
  | { type: 'historyCleared' }
  | { type: 'presetSaved' }
  | { type: 'presetRemoved'; notation: string };

const initial: State = { loaded: false, config: { count: 2, sides: 6, modifier: 0 }, history: [], presets: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loaded':
      // A roll made before storage finished loading must not be lost.
      return {
        ...state,
        loaded: true,
        history: [...state.history, ...action.history].slice(0, HISTORY_LIMIT),
        presets: action.presets,
      };
    case 'configChanged':
      return { ...state, config: normalize(action.config) };
    case 'rolled':
      return { ...state, history: [action.result, ...state.history].slice(0, HISTORY_LIMIT) };
    case 'historyCleared':
      return { ...state, history: [] };
    case 'presetSaved': {
      const n = formatNotation(state.config);
      if (state.presets.some((p) => formatNotation(p) === n)) return state;
      return { ...state, presets: [...state.presets, state.config] };
    }
    case 'presetRemoved':
      return { ...state, presets: state.presets.filter((p) => formatNotation(p) !== action.notation) };
  }
}

export function useDiceRoller(storage: DiceStorage, rng: Rng = Math.random, now: () => number = Date.now) {
  const [state, dispatch] = useReducer(reducer, initial);
  const counter = useRef(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([storage.loadHistory(), storage.loadPresets()]).then(([history, presets]) => {
      if (!cancelled) dispatch({ type: 'loaded', history, presets });
    });
    return () => {
      cancelled = true;
    };
  }, [storage]);

  // Persist after load only, so the empty initial state never overwrites saved history.
  useEffect(() => {
    if (state.loaded) void storage.saveHistory(state.history);
  }, [state.loaded, state.history, storage]);
  useEffect(() => {
    if (state.loaded) void storage.savePresets(state.presets);
  }, [state.loaded, state.presets, storage]);

  // Rapid taps: each tap is its own synchronous dispatch, so none is lost and
  // ids stay unique even within the same millisecond.
  const roll = useCallback(
    (config?: RollConfig) => {
      const id = `${now()}-${counter.current++}`;
      dispatch({ type: 'rolled', result: rollDice(config ?? state.config, rng, now(), id) });
    },
    [state.config, rng, now],
  );

  return {
    state,
    roll,
    setConfig: useCallback((config: RollConfig) => dispatch({ type: 'configChanged', config }), []),
    clearHistory: useCallback(() => dispatch({ type: 'historyCleared' }), []),
    savePreset: useCallback(() => dispatch({ type: 'presetSaved' }), []),
    removePreset: useCallback((notation: string) => dispatch({ type: 'presetRemoved', notation }), []),
  };
}
