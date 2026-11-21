import { render, screen } from '@testing-library/react-native';

import App from '../App';
import { testServices } from '../test/testServices';

test('home shows two horizontal shelves', async () => {
  await render(<App services={testServices()} />);
  expect(await screen.findByText("Today's deals")).toBeTruthy();
  expect(screen.getByText('Recently viewed')).toBeTruthy();
});
