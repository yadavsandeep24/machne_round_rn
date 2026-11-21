import type { AxiosInstance } from 'axios';

import { createHttp } from '../core/network/http';
import { asyncStorageStore, type KeyValueStore } from '../core/storage/keyValueStore';
import { createPostRepository, type PostRepository } from '../features/posts/data/postRepository';

/**
 * Dependency injection without a container: everything a thunk needs is
 * passed as the thunk `extraArgument`. Tests pass fakes.
 */
export interface Services {
  http: AxiosInstance;
  store: KeyValueStore;
  postRepository: PostRepository;
}

export function createServices(): Services {
  const http = createHttp();
  const store = asyncStorageStore;
  return { http, store, postRepository: createPostRepository(http, store) };
}
