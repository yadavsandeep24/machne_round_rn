import { readJson, writeJson, type KeyValueStore } from '../../../core/storage/keyValueStore';
import type { RollConfig, RollResult } from '../domain/dice';

/**
 * Persistence choice: AsyncStorage (JSON). History is small, append-only and
 * read once at launch; it needs no queries, so SQLite would be overkill.
 * MMKV would be faster (synchronous) if history grew or was read often.
 * Capped so the stored blob stays small.
 */
export const HISTORY_LIMIT = 100;
const HISTORY_KEY = 'dice_history_v1';
const PRESETS_KEY = 'dice_presets_v1';

export interface DiceStorage {
  loadHistory(): Promise<RollResult[]>;
  saveHistory(history: RollResult[]): Promise<void>;
  loadPresets(): Promise<RollConfig[]>;
  savePresets(presets: RollConfig[]): Promise<void>;
}

export function createDiceStorage(store: KeyValueStore): DiceStorage {
  return {
    loadHistory: async () => {
      const list = await readJson<unknown>(store, HISTORY_KEY, []);
      return Array.isArray(list) ? (list as RollResult[]) : []; // corrupt -> empty
    },
    saveHistory: (history) => writeJson(store, HISTORY_KEY, history.slice(0, HISTORY_LIMIT)),
    loadPresets: async () => {
      const list = await readJson<unknown>(store, PRESETS_KEY, []);
      return Array.isArray(list) ? (list as RollConfig[]) : [];
    },
    savePresets: (presets) => writeJson(store, PRESETS_KEY, presets),
  };
}
