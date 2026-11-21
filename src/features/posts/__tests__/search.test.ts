import { makeStore } from '../../../app/store';
import { FakePostRepository, fakePost } from '../../../../test/fakePostRepository';
import { testServices } from '../../../../test/testServices';
import { searchCleared, searchPosts } from '../state/postsSlice';

function setup() {
  const repo = new FakePostRepository();
  repo.remote = [fakePost(1, 'React tips'), fakePost(2, 'Redux toolkit'), fakePost(3, 'React native')];
  const store = makeStore(testServices({ postRepository: repo }));
  return { repo, store, posts: () => store.getState().posts };
}

test('searches and stores the results for the trimmed query', async () => {
  const { store, posts } = setup();
  await store.dispatch(searchPosts({ query: ' react ' }));
  expect(posts().query).toBe('react');
  expect(posts().searchResults.map((p) => p.id)).toEqual([1, 3]);
});

test('aborting a slow older query keeps the newer results (switchMap)', async () => {
  const { repo, store, posts } = setup();
  repo.searchDelays.set('redux', 50);
  const slow = store.dispatch(searchPosts({ query: 'redux' }));
  slow.abort(); // what the effect cleanup does when the query changes
  await store.dispatch(searchPosts({ query: 'react' }));
  await slow;
  expect(posts().query).toBe('react');
  expect(posts().searchStatus).toBe('success');
  expect(posts().searchResults.map((p) => p.id)).toEqual([1, 3]);
});

test('the same successful query is not requested again; force retries', async () => {
  const { repo, store } = setup();
  await store.dispatch(searchPosts({ query: 'react' }));
  await store.dispatch(searchPosts({ query: 'react' }));
  expect(repo.searchedQueries).toEqual(['react']);
  await store.dispatch(searchPosts({ query: 'react', force: true }));
  expect(repo.searchedQueries).toEqual(['react', 'react']);
});

test('errors are stored; clearing resets to browse mode', async () => {
  const { repo, store, posts } = setup();
  repo.searchFailWith = { kind: 'noInternet' };
  await store.dispatch(searchPosts({ query: 'react' }));
  expect(posts().searchStatus).toBe('failure');
  store.dispatch(searchCleared());
  expect(posts()).toMatchObject({ query: '', searchStatus: 'idle', searchResults: [] });
});
