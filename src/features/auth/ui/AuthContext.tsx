import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AuthApi } from '../data/authApi';
import type { TokenStore } from '../data/tokenStore';

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

interface AuthValue {
  status: AuthStatus;
  expired: boolean;
  signIn(username: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({
  tokens,
  authApi,
  expiredSignal,
  children,
}: {
  tokens: TokenStore;
  authApi: AuthApi;
  /** Lets the interceptor tell the UI the session ended. */
  expiredSignal: { subscribe(cb: () => void): () => void };
  children: ReactNode;
}) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [expired, setExpired] = useState(false);

  // Restore at launch from secure storage, without a network call.
  useEffect(() => {
    let cancelled = false;
    tokens.load().then((s) => {
      if (!cancelled) setStatus(s ? 'signedIn' : 'signedOut');
    });
    return () => {
      cancelled = true;
    };
  }, [tokens]);

  useEffect(
    () =>
      expiredSignal.subscribe(() => {
        setExpired(true);
        setStatus('signedOut');
      }),
    [expiredSignal],
  );

  const signIn = useCallback(
    async (username: string, password: string) => {
      const session = await authApi.login(username, password);
      await tokens.save(session);
      setExpired(false);
      setStatus('signedIn');
    },
    [authApi, tokens],
  );

  const signOut = useCallback(async () => {
    await tokens.clear();
    setStatus('signedOut');
  }, [tokens]);

  const value = useMemo(() => ({ status, expired, signIn, signOut }), [status, expired, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
