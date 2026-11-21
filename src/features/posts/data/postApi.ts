import type { AxiosInstance } from 'axios';

import { parsePost, type Post } from '../domain/post';

export const PAGE_SIZE = 20;

export async function fetchPosts(
  http: AxiosInstance,
  { page = 1, limit = PAGE_SIZE, query, signal }: { page?: number; limit?: number; query?: string; signal?: AbortSignal } = {},
): Promise<Post[]> {
  const res = await http.get<unknown[]>('posts', {
    params: { _page: page, _limit: limit, ...(query ? { q: query } : {}) },
    signal,
  });
  return res.data.map(parsePost);
}
