import type { AppError } from '../src/core/error/appError';
import { err, ok } from '../src/core/result';
import type { PostRepository } from '../src/features/posts/data/postRepository';
import type { Post } from '../src/features/posts/domain/post';

export const fakePost = (id: number, title = `Post ${id}`): Post => ({
  id,
  userId: 1,
  title,
  body: `Body ${id}`,
});

/** In-memory repository with the same contract as the real one. */
export class FakePostRepository implements PostRepository {
  cache: Post[];
  remote: Post[] = Array.from({ length: 20 }, (_, i) => fakePost(i + 1));
  failWith?: AppError;
  refreshCalls = 0;
  gate?: Promise<void>;

  constructor(cached: Post[] = []) {
    this.cache = cached;
  }

  async readCache() {
    return this.cache;
  }

  async refresh() {
    this.refreshCalls++;
    await this.gate;
    if (this.failWith) return err<Post[]>(this.failWith);
    this.cache = this.remote;
    return ok(this.remote);
  }
}
