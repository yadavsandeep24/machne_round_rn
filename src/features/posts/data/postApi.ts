import type { AxiosInstance } from 'axios';

import { parseComment, type Comment } from '../domain/comment';
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

export async function fetchPost(http: AxiosInstance, id: number, signal?: AbortSignal): Promise<Post> {
  const res = await http.get<unknown>(`posts/${id}`, { signal });
  return parsePost(res.data);
}

export async function fetchComments(
  http: AxiosInstance,
  postId: number,
  signal?: AbortSignal,
): Promise<Comment[]> {
  const res = await http.get<unknown[]>(`posts/${postId}/comments`, { signal });
  return res.data.map(parseComment);
}
