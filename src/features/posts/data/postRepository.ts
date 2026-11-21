import type { AxiosInstance } from 'axios';

import { safeCall } from '../../../core/network/http';
import { ok, type Result } from '../../../core/result';
import { readJson, writeJson, type KeyValueStore } from '../../../core/storage/keyValueStore';
import type { Comment } from '../domain/comment';
import type { Post } from '../domain/post';
import { fetchComments, fetchPost, fetchPosts, PAGE_SIZE } from './postApi';

/**
 * Offline-first: the screen shows the cache immediately, then the network
 * result replaces it and is written back to the cache.
 */
export interface PostRepository {
  readCache(): Promise<Post[]>;
  /** Fetches page 1 and replaces the cache. */
  refresh(): Promise<Result<Post[]>>;
  /** Cache first; network fallback for posts that were never cached (deep link, search). */
  getPost(id: number, signal?: AbortSignal): Promise<Result<Post>>;
  getComments(postId: number, signal?: AbortSignal): Promise<Result<Comment[]>>;
}

const CACHE_KEY = 'posts_cache_v1';

export function createPostRepository(http: AxiosInstance, store: KeyValueStore): PostRepository {
  const readCache = () => readJson<Post[]>(store, CACHE_KEY, []);
  return {
    readCache,
    refresh: () =>
      safeCall(async () => {
        const posts = await fetchPosts(http, { page: 1, limit: PAGE_SIZE });
        await writeJson(store, CACHE_KEY, posts);
        return posts;
      }),
    getPost: async (id, signal) => {
      const cached = (await readCache()).find((p) => p.id === id);
      return cached ? ok(cached) : safeCall(() => fetchPost(http, id, signal));
    },
    getComments: (postId, signal) => safeCall(() => fetchComments(http, postId, signal)),
  };
}
