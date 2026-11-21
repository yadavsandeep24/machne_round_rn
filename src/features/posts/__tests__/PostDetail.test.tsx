import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../../../../App';
import { FakePostRepository } from '../../../../test/fakePostRepository';
import { testServices } from '../../../../test/testServices';

const renderApp = (repo: FakePostRepository) =>
  render(<App services={testServices({ postRepository: repo })} />);

test('tapping a post opens its detail with comments', async () => {
  await renderApp(new FakePostRepository());
  fireEvent.press(await screen.findByText('Post 3'));
  expect(await screen.findByText('Body 3')).toBeTruthy();
  expect(await screen.findByText('Nice post')).toBeTruthy();
});

test('comments failure still shows the post', async () => {
  const repo = new FakePostRepository();
  repo.commentsFailWith = { kind: 'server', status: 500 };
  await renderApp(repo);
  fireEvent.press(await screen.findByText('Post 2'));
  expect(await screen.findByText('Body 2')).toBeTruthy();
  expect(await screen.findByText(/Something went wrong on our side \(500\)/)).toBeTruthy();
});
