import { makeStore } from '../../../app/store';
import { FakePostRepository, fakePost } from '../../../../test/fakePostRepository';
import { testServices } from '../../../../test/testServices';
import { loadCachedPosts, refreshPosts } from '../state/postsSlice';

function setup(repo = new FakePostRepository()) {
  const store = makeStore(testServices({ postRepository: repo }));
  return { store, repo };
}

test('loads from the network into an empty cache', async () => {
  const { store } = setup();
  await store.dispatch(refreshPosts());
  const s = store.getState().posts;
  expect(s.status).toBe('success');
  expect(s.items).toHaveLength(20);
  expect(s.isRefreshing).toBe(false);
});

test('network error with an empty cache is a full-screen failure', async () => {
  const repo = new FakePostRepository();
  repo.failWith = { kind: 'noInternet' };
  const { store } = setup(repo);
  await store.dispatch(loadCachedPosts());
  await store.dispatch(refreshPosts());
  expect(store.getState().posts).toMatchObject({ status: 'failure', error: { kind: 'noInternet' } });
});

test('network error with cached data keeps the data and reports the error', async () => {
  const repo = new FakePostRepository([fakePost(99)]);
  repo.failWith = { kind: 'timeout' };
  const { store } = setup(repo);
  await store.dispatch(loadCachedPosts());
  await store.dispatch(refreshPosts());
  const s = store.getState().posts;
  expect(s.status).toBe('success');
  expect(s.items.map((p) => p.id)).toEqual([99]);
  expect(s.error?.kind).toBe('timeout');
});

test('a slow cache read never overwrites fresher network data', async () => {
  const repo = new FakePostRepository([fakePost(99)]);
  const { store } = setup(repo);
  await store.dispatch(refreshPosts());
  await store.dispatch(loadCachedPosts());
  expect(store.getState().posts.items).toHaveLength(20);
});

test('refresh while one is in flight is dropped', async () => {
  const repo = new FakePostRepository();
  let open!: () => void;
  repo.gate = new Promise((r) => (open = r));
  const { store } = setup(repo);
  const first = store.dispatch(refreshPosts());
  store.dispatch(refreshPosts());
  store.dispatch(refreshPosts());
  open();
  await first;
  expect(repo.refreshCalls).toBe(1);
});
