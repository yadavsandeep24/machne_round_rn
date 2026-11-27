import { render, screen } from '@testing-library/react-native';

import App from '../App';
import { testServices } from '../test/testServices';

test('app shell renders the home route', async () => {
  await render(<App services={testServices()} />);
  expect(await screen.findByText('Payment pay_1')).toBeTruthy();
});
