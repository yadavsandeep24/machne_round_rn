export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  company?: { name: string };
}

/** Injected so tests can control timing (and so components never hard-code fetch). */
export interface UsersApi {
  getUsers(signal?: AbortSignal): Promise<User[]>;
  getUser(id: number, signal?: AbortSignal): Promise<User>;
}

const BASE = 'https://jsonplaceholder.typicode.com';

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  // fetch only rejects on network errors: a 404/500 must be checked by hand.
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const usersApi: UsersApi = {
  getUsers: (signal) => getJson<User[]>(`${BASE}/users`, signal),
  getUser: (id, signal) => getJson<User>(`${BASE}/users/${id}`, signal),
};
