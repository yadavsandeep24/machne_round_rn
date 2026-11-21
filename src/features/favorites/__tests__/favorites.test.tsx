import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../../../../App';
import { makeStore } from '../../../app/store';
import { createMemoryStore } from '../../../core/storage/keyValueStore';
import { testServices } from '../../../../test/testServices';
import { loadFavorites, toggleFavorite } from '../favoritesSlice';

test('toggle flips optimistically and persists', async () => {
  const kv = createMemoryStore();
  const store = makeStore(testServices({ store: kv }));
  await store.dispatch(toggleFavorite(3));
  await store.dispatch(toggleFavorite(5));
  await store.dispatch(toggleFavorite(3));
  expect(store.getState().favorites.ids).toEqual({ 5: true });

  const relaunched = makeStore(testServices({ store: kv }));
  await relaunched.dispatch(loadFavorites());
  expect(relaunched.getState().favorites.ids).toEqual({ 5: true });
});

test('favoriting in the list shows on the detail screen', async () => {
  await render(<App services={testServices()} />);
  await screen.findByText('Post 1');
  await fireEvent.press(screen.getAllByLabelText('Add to favorites')[0]!);
  expect(screen.getAllByLabelText('Remove from favorites')).toHaveLength(1);

  await fireEvent.press(screen.getByText('Post 1'));
  await screen.findByText('Body 1');
  expect(screen.getAllByLabelText('Remove from favorites').length).toBeGreaterThan(0);
});
