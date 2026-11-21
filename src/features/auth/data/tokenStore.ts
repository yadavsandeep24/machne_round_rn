import * as SecureStore from 'expo-secure-store';

export interface Session {
  accessToken: string;
  refreshToken: string;
}

export interface TokenStore {
  load(): Promise<Session | null>;
  save(session: Session): Promise<void>;
  clear(): Promise<void>;
  /** In-memory copy for the interceptor (no async read per request). */
  current(): Session | null;
}

const KEY = 'session_v1';

/**
 * Tokens live in the iOS Keychain / Android Keystore-backed storage, NOT in
 * AsyncStorage (plain, unencrypted files that backups and rooted devices can
 * read). THIS_DEVICE_ONLY: not restored onto another phone from a backup.
 */
export function createSecureTokenStore(): TokenStore {
  let cached: Session | null = null;
  const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
  return {
    async load() {
      const raw = await SecureStore.getItemAsync(KEY, options);
      try {
        cached = raw ? (JSON.parse(raw) as Session) : null;
      } catch {
        cached = null;
      }
      return cached;
    },
    async save(session) {
      cached = session;
      await SecureStore.setItemAsync(KEY, JSON.stringify(session), options);
    },
    async clear() {
      cached = null;
      await SecureStore.deleteItemAsync(KEY, options);
    },
    current: () => cached,
  };
}
