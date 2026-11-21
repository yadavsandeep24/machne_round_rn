import type { AppError } from '../src/core/error/appError';
import { err, ok } from '../src/core/result';
import type { Comment } from '../src/features/posts/domain/comment';
import type { Page, PostRepository } from '../src/features/posts/data/postRepository';
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
  static PAGE_SIZE = 20;
  /** The whole "server" data set, served in pages of 20. */
  remote: Post[] = Array.from({ length: 45 }, (_, i) => fakePost(i + 1));
  failWith?: AppError;
  loadMoreFailWith?: AppError;
  requestedPages: number[] = [];
  pageGates = new Map<number, Promise<void>>();
  refreshCalls = 0;
  gate?: Promise<void>;

  constructor(cached: Post[] = []) {
    this.cache = cached;
  }

  async readCache() {
    return this.cache;
  }

  private page(n: number) {
    const size = FakePostRepository.PAGE_SIZE;
    const posts = this.remote.slice((n - 1) * size, n * size);
    return { posts, endReached: posts.length < size };
  }

  async refresh() {
    this.refreshCalls++;
    await this.gate;
    if (this.failWith) return err<Page>(this.failWith);
    const first = this.page(1);
    this.cache = first.posts;
    return ok(first);
  }

  async loadPage(n: number) {
    this.requestedPages.push(n);
    await this.pageGates.get(n);
    if (this.loadMoreFailWith) return err<Page>(this.loadMoreFailWith);
    return ok(this.page(n));
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

  searchedQueries: string[] = [];
  searchFailWith?: AppError;
  searchDelays = new Map<string, number>();

  async search(query: string, signal?: AbortSignal) {
    this.searchedQueries.push(query);
    const delay = this.searchDelays.get(query);
    if (delay) await new Promise((r) => setTimeout(r, delay));
    if (signal?.aborted) return err<Post[]>({ kind: 'cancelled' });
    if (this.searchFailWith) return err<Post[]>(this.searchFailWith);
    const q = query.toLowerCase();
    return ok(this.remote.filter((p) => p.title.toLowerCase().includes(q)));
  }
}
