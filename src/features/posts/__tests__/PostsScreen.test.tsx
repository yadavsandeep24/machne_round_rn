import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../../../../App';
import { FakePostRepository } from '../../../../test/fakePostRepository';
import { testServices } from '../../../../test/testServices';

const renderApp = (repo: FakePostRepository) =>
  render(<App services={testServices({ postRepository: repo })} />);

test('shows posts after loading', async () => {
  await renderApp(new FakePostRepository());
  expect(await screen.findByText('Post 1')).toBeTruthy();
});

test('shows the error with Retry, and Retry recovers', async () => {
  const repo = new FakePostRepository();
  repo.failWith = { kind: 'noInternet' };
  await renderApp(repo);
  expect(await screen.findByText(/No internet connection/)).toBeTruthy();

  repo.failWith = undefined;
  await fireEvent.press(screen.getByText('Retry'));
  expect(await screen.findByText('Post 1')).toBeTruthy();
});

test('shows the empty state', async () => {
  const repo = new FakePostRepository();
  repo.remote = [];
  await renderApp(repo);
  expect(await screen.findByText('No posts yet')).toBeTruthy();
});
