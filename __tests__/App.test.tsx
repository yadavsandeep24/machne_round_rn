import { render, screen } from '@testing-library/react-native';

import App from '../App';
import { testServices } from '../test/testServices';

test('app shell renders the checkout screen', async () => {
  await render(<App services={testServices()} />);
  expect(await screen.findByText('Pay ₹1,499.00')).toBeTruthy();
});
