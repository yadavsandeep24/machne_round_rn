import { act, fireEvent, render, screen } from '@testing-library/react-native';

import App from '../../../../App';
import { FakePostRepository } from '../../../../test/fakePostRepository';
import { testServices } from '../../../../test/testServices';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('typing debounces into one search; clearing returns to the list', async () => {
  const repo = new FakePostRepository();
  await render(<App services={testServices({ postRepository: repo })} />);
  expect(await screen.findByText('Post 1')).toBeTruthy();

  const input = screen.getByLabelText('Search posts');
  await fireEvent.changeText(input, 'P');
  await fireEvent.changeText(input, 'Post');
  await fireEvent.changeText(input, 'Post 42');
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  expect(await screen.findByText('Post 42')).toBeTruthy();
  expect(screen.queryByText('Post 1')).toBeNull();
  expect(repo.searchedQueries).toEqual(['Post 42']);

  await fireEvent.changeText(input, 'zzz');
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  expect(await screen.findByText('No results for "zzz"')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Clear'));
  expect(await screen.findByText('Post 1')).toBeTruthy();
});
