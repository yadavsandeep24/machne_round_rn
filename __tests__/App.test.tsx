import { render, screen } from '@testing-library/react-native';

import App from '../App';
import { testServices } from '../test/testServices';

test('app opens checkout with the order total', async () => {
  await render(<App services={testServices()} />);
  expect(await screen.findByText('Pay ₹588.82')).toBeTruthy();
});
