import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ServicesProvider } from '../../../app/ServicesContext';
import { FakePostRepository, fakePost } from '../../../../test/fakePostRepository';
import { testServices } from '../../../../test/testServices';
import { usePostDetail } from '../ui/usePostDetail';

function wrapperFor(repo: FakePostRepository) {
  const services = testServices({ postRepository: repo });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ServicesProvider services={services}>{children}</ServicesProvider>;
  };
}

test('falls back to the network for an uncached post', async () => {
  const repo = new FakePostRepository();
  repo.remoteById.set(7, fakePost(7));
  const { result } = await renderHook(() => usePostDetail(7), { wrapper: wrapperFor(repo) });
  await waitFor(() => expect(result.current.state.status).toBe('loaded'));
});

test('a missing post is an error', async () => {
  const { result } = await renderHook(() => usePostDetail(404), {
    wrapper: wrapperFor(new FakePostRepository()),
  });
  await waitFor(() =>
    expect(result.current.state).toMatchObject({ status: 'error', error: { kind: 'notFound' } }),
  );
});

test('changing the id aborts the old request (no stale post)', async () => {
  const repo = new FakePostRepository([fakePost(1), fakePost(2)]);
  repo.commentsDelayMs = 30;
  const { result, rerender } = await renderHook(({ id }: { id: number }) => usePostDetail(id), {
    initialProps: { id: 1 },
    wrapper: wrapperFor(repo),
  });
  await rerender({ id: 2 });
  await waitFor(() => expect(result.current.state.status).toBe('loaded'));
  expect(result.current.state).toMatchObject({ post: { id: 2 } });
});
