import { makeStore } from '../../../app/store';
import { FakePostRepository } from '../../../../test/fakePostRepository';
import { testServices } from '../../../../test/testServices';
import { loadNextPage, refreshPosts } from '../state/postsSlice';

async function setup() {
  const repo = new FakePostRepository();
  const store = makeStore(testServices({ postRepository: repo }));
  await store.dispatch(refreshPosts());
  return { repo, store, posts: () => store.getState().posts };
}

test('loads pages until the end (45 = 20 + 20 + 5)', async () => {
  const { repo, store, posts } = await setup();
  await store.dispatch(loadNextPage());
  await store.dispatch(loadNextPage());
  await store.dispatch(loadNextPage()); // ignored: end reached
  expect(posts().items).toHaveLength(45);
  expect(posts().hasReachedEnd).toBe(true);
  expect(repo.requestedPages).toEqual([2, 3]);
});

test('concurrent onEndReached calls make one request', async () => {
  const { repo, store } = await setup();
  await Promise.all([
    store.dispatch(loadNextPage()),
    store.dispatch(loadNextPage()),
    store.dispatch(loadNextPage()),
  ]);
  expect(repo.requestedPages).toEqual([2]);
});

test('an error blocks auto-retry; footer Retry loads again', async () => {
  const { repo, store, posts } = await setup();
  repo.loadMoreFailWith = { kind: 'noInternet' };
  await store.dispatch(loadNextPage());
  await store.dispatch(loadNextPage()); // scrolling again: ignored
  expect(posts().loadMoreError?.kind).toBe('noInternet');
  expect(repo.requestedPages).toEqual([2]);

  repo.loadMoreFailWith = undefined;
  await store.dispatch(loadNextPage({ isRetry: true }));
  expect(posts().items).toHaveLength(40);
  expect(repo.requestedPages).toEqual([2, 2]);
});

test('a page that finishes after a refresh is dropped as stale', async () => {
  const { repo, store, posts } = await setup();
  let open!: () => void;
  repo.pageGates.set(2, new Promise((r) => (open = r)));
  const pending = store.dispatch(loadNextPage());
  // The user pulls to refresh meanwhile. (The guard blocks load-more during a
  // refresh, but a load-more already in flight can still finish after it.)
  await store.dispatch(refreshPosts());
  open();
  await pending;
  expect(posts().items).toHaveLength(20);
  expect(posts().nextPage).toBe(2);
});
