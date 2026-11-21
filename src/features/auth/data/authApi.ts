import type { AxiosInstance } from 'axios';

import type { Session } from './tokenStore';

export const AUTH_BASE_URL = 'https://dummyjson.com/';

export interface Profile {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Uses a PLAIN axios instance (no auth interceptor), so refresh can never recurse. */
export function createAuthApi(plain: AxiosInstance) {
  return {
    async login(username: string, password: string): Promise<Session> {
      const res = await plain.post('auth/login', { username, password, expiresInMins: 30 });
      return { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken };
    },
    async refresh(refreshToken: string): Promise<Session> {
      const res = await plain.post('auth/refresh', { refreshToken, expiresInMins: 30 });
      return { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken };
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
