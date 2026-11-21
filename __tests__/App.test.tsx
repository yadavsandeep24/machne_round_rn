import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';
import { testServices } from '../test/testServices';

test('gallery lists the 10 challenges and opens one with Buggy/Fixed', async () => {
  await render(<App services={testServices()} />);
  await fireEvent.press(await screen.findByText('Mutating state in place'));
  await fireEvent.press(screen.getByText('Fixed'));
  await fireEvent.press(screen.getByText('Add'));
  expect(screen.getByText('Items in cart: 1')).toBeTruthy();
  await fireEvent.press(screen.getByText('Show answer'));
  expect(screen.getByText('Root cause')).toBeTruthy();
});
