import type { AppError } from '../src/core/error/appError';
import { err, ok } from '../src/core/result';
import type { Comment } from '../src/features/posts/domain/comment';
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

  /** Posts only the "network" knows about. */
  remoteById = new Map<number, Post>();
  commentsFailWith?: AppError;
  commentsDelayMs = 0;

  async getPost(id: number) {
    const cached = this.cache.find((p) => p.id === id);
    if (cached) return ok(cached);
    const remote = this.remoteById.get(id);
    return remote ? ok(remote) : err<Post>({ kind: 'notFound' });
  }

  async getComments(postId: number, signal?: AbortSignal) {
    if (this.commentsDelayMs) await new Promise((r) => setTimeout(r, this.commentsDelayMs));
    if (signal?.aborted) return err<Comment[]>({ kind: 'cancelled' });
    if (this.commentsFailWith) return err<Comment[]>(this.commentsFailWith);
    return ok<Comment[]>([{ id: postId * 10, name: 'Commenter', email: 'a@b.c', body: 'Nice post' }]);
  }
}
