import type { AxiosInstance } from 'axios';

import { safeCall } from '../../../core/network/http';
import type { Result } from '../../../core/result';
import { readJson, writeJson, type KeyValueStore } from '../../../core/storage/keyValueStore';
import type { Post } from '../domain/post';
import { fetchPosts, PAGE_SIZE } from './postApi';

/**
 * Offline-first: the screen shows the cache immediately, then the network
 * result replaces it and is written back to the cache.
 */
export interface PostRepository {
  readCache(): Promise<Post[]>;
  /** Fetches page 1 and replaces the cache. */
  refresh(): Promise<Result<Post[]>>;
}

const CACHE_KEY = 'posts_cache_v1';

export function createPostRepository(http: AxiosInstance, store: KeyValueStore): PostRepository {
  return {
    readCache: () => readJson<Post[]>(store, CACHE_KEY, []),
    refresh: () =>
      safeCall(async () => {
        const posts = await fetchPosts(http, { page: 1, limit: PAGE_SIZE });
        await writeJson(store, CACHE_KEY, posts);
        return posts;
      }),
  };
}
